import express, {
  NextFunction,
  Request,
  Response
} from 'express';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  AuthSession,
  createSessionToken,
  parseCookie,
  serializeExpiredSessionCookie,
  serializeSessionCookie,
  verifyPassword,
  verifySessionToken
} from './auth';
import { ServerConfig } from './config';
import {
  apiError,
  createServerCapabilities,
  createServerStatusContract,
  isAllowedOrigin,
  isMutationMethod,
  validateModeHeader
} from './contracts';
import { HermesReadOnlyAdapter, HermesReadOnlyError } from './hermesReadOnlyAdapter';
import { SupabaseConsoleAdapter, SupabaseConsoleError } from './supabaseConsoleAdapter';
import {
  MiniMaxWritingAdapter,
  MiniMaxWritingError,
  WritingContext
} from './miniMaxWritingAdapter';
import { SERVER_SETTINGS, TEAM_PROFILES } from './readModels';
import type { AgentProfile } from '../src/types';

const API_PREFIX = '/api/v1';

function getSession(response: Response): AuthSession | null {
  return (response.locals as { authSession?: AuthSession }).authSession ?? null;
}

export interface AppDependencies {
  hermesAdapter?: HermesReadOnlyAdapter;
  supabaseAdapter?: SupabaseConsoleAdapter;
  writingAdapter?: MiniMaxWritingAdapter;
  frontendDirectory?: string | null;
}

export function createApp(config: ServerConfig, dependencies: AppDependencies = {}) {
  const app = express();
  const frontendDirectory = dependencies.frontendDirectory === undefined
    ? resolve(process.cwd(), 'dist')
    : dependencies.frontendDirectory;
  const secureCookies = config.publicOrigin.startsWith('https://');
  const hermesAdapter = dependencies.hermesAdapter ?? (
    config.hermesReadOnlyEnabled
      ? new HermesReadOnlyAdapter({
          binary: config.hermesBinary,
          boards: config.hermesBoards,
          timeoutMs: 8_000,
          maxTasks: 500
        })
      : null
  );
  const supabaseAdapter = dependencies.supabaseAdapter ?? (
    config.supabaseEnabled
      ? new SupabaseConsoleAdapter({
          url: config.supabaseUrl,
          secretKey: config.supabaseSecretKey,
          schema: config.supabaseSchema,
          timeoutMs: 8_000,
          maxResponseBytes: 1_048_576
        })
      : null
  );
  const writingAdapter = dependencies.writingAdapter ?? (
    config.aiWritingEnabled
      ? new MiniMaxWritingAdapter({
          apiKey: config.minimaxApiKey,
          model: config.minimaxModel,
          baseUrl: config.minimaxBaseUrl,
          timeoutMs: 15_000
        })
      : null
  );
  const writingRequestTimes: number[] = [];

  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb', strict: true }));

  app.get('/health/live', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use(API_PREFIX, (request: Request, response: Response, next: NextFunction) => {
    const correlationId = request.header('x-request-id') || randomUUID();
    response.setHeader('x-request-id', correlationId);
    response.setHeader('cache-control', 'no-store');

    if (!validateModeHeader(config.mode, request.header('x-nuga-mode'))) {
      response.status(409).json(
        apiError(
          'MODE_MISMATCH',
          'El modo solicitado no coincide con el modo efectivo del servidor.',
          correlationId
        )
      );
      return;
    }

    if (
      isMutationMethod(request.method) &&
      !isAllowedOrigin(config.publicOrigin, request.header('origin'))
    ) {
      response.status(403).json(
        apiError(
          'ORIGIN_DENIED',
          'El origen de la solicitud no está autorizado.',
          correlationId
        )
      );
      return;
    }

    next();
  });

  app.get(`${API_PREFIX}/status`, (_request, response) => {
    response.status(200).json(createServerStatusContract(config));
  });

  app.get(`${API_PREFIX}/capabilities`, (_request, response) => {
    response.status(200).json(createServerCapabilities(config.mode, config.hermesReadOnlyEnabled));
  });

  app.post(`${API_PREFIX}/auth/login`, (request, response) => {
    const body = request.body as Record<string, unknown>;
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (
      username !== config.ownerUsername ||
      !verifyPassword(password, config.ownerPasswordHash)
    ) {
      response.status(401).json(
        apiError('UNAUTHORIZED', 'Usuario o contraseña inválidos.')
      );
      return;
    }

    const { token, session } = createSessionToken(
      config.ownerUsername,
      config.sessionSecret
    );

    response.setHeader(
      'set-cookie',
      serializeSessionCookie(token, secureCookies)
    );
    response.status(200).json({
      user: {
        id: `owner:${config.ownerUsername}`,
        name: 'Ramiro',
        email: '',
        role: 'owner',
        title: 'Propietario',
        avatar: ''
      },
      csrfToken: session.csrfToken,
      expiresAt: new Date(session.expiresAt * 1000).toISOString()
    });
  });

  const requireSession = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const token = parseCookie(request.header('cookie'), 'nuga_session');
    const session = token
      ? verifySessionToken(token, config.sessionSecret)
      : null;

    if (!session || session.subject !== config.ownerUsername) {
      response.status(401).json(
        apiError('UNAUTHORIZED', 'No existe una sesión válida.')
      );
      return;
    }

    (response.locals as { authSession?: AuthSession }).authSession = session;
    next();
  };

  const requireCsrf = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const session = getSession(response);
    if (
      !session ||
      request.header('x-csrf-token') !== session.csrfToken
    ) {
      response.status(403).json(
        apiError('CSRF_DENIED', 'La validación CSRF falló.')
      );
      return;
    }
    next();
  };

  app.get(`${API_PREFIX}/auth/me`, requireSession, (_request, response) => {
    const session = getSession(response);
    response.status(200).json({
      id: `owner:${config.ownerUsername}`,
      name: 'Ramiro',
      email: '',
      role: 'owner',
      title: 'Propietario',
      avatar: '',
      csrfToken: session?.csrfToken,
      sessionExpiresAt: session
        ? new Date(session.expiresAt * 1000).toISOString()
        : undefined
    });
  });

  app.post(
    `${API_PREFIX}/auth/logout`,
    requireSession,
    requireCsrf,
    (_request, response) => {
      response.setHeader(
        'set-cookie',
        serializeExpiredSessionCookie(secureCookies)
      );
      response.status(204).end();
    }
  );

  const hermesUnavailable = (_request: Request, response: Response) => {
    response.status(503).json(
      apiError(
        'HERMES_NOT_CONNECTED',
        'Hermes aún no está conectado a NUGA Console API.'
      )
    );
  };

  const hermesRead = (
    operation: () => Promise<unknown>
  ) => async (_request: Request, response: Response) => {
    if (!hermesAdapter) {
      hermesUnavailable(_request, response);
      return;
    }
    try {
      response.status(200).json(await operation());
    } catch (error) {
      const denied = error instanceof HermesReadOnlyError && error.code === 'DENIED';
      response.status(denied ? 403 : 503).json(
        apiError(
          denied ? 'HERMES_SCOPE_DENIED' : 'HERMES_READ_UNAVAILABLE',
          denied ? 'El recurso Hermes está fuera del alcance permitido.' : 'Hermes no está disponible para lectura.'
        )
      );
    }
  };

  app.get(`${API_PREFIX}/agents`, requireSession, async (_request, response) => {
    if (!supabaseAdapter) {
      response.status(200).json(TEAM_PROFILES);
      return;
    }
    try {
      const overrides = await supabaseAdapter.listAgentProfiles();
      const profiles = TEAM_PROFILES.map(profile => {
        const override = overrides.find(candidate => candidate.role === profile.id);
        if (!override) return profile;
        return {
          ...profile,
          avatar: typeof override.avatar_data_url === 'string' ? override.avatar_data_url : profile.avatar,
          autonomyLevel: typeof override.autonomy_level === 'string'
            ? override.autonomy_level as AgentProfile['autonomyLevel']
            : profile.autonomyLevel,
          systemInstructions: typeof override.system_instructions === 'string'
            ? override.system_instructions
            : profile.systemInstructions
        };
      });
      response.status(200).json(profiles);
    } catch {
      response.status(200).json(TEAM_PROFILES);
    }
  });
  app.get(`${API_PREFIX}/agents/:role`, requireSession, (request, response) => {
    const profile = TEAM_PROFILES.find(candidate => candidate.id === request.params.role);
    response.status(profile ? 200 : 404).json(profile ?? apiError('NOT_FOUND', 'Perfil no encontrado.'));
  });
  app.patch(`${API_PREFIX}/agents/:role`, requireSession, requireCsrf, async (request, response) => {
    const baseProfile = TEAM_PROFILES.find(candidate => candidate.id === request.params.role);
    if (!baseProfile) {
      response.status(404).json(apiError('NOT_FOUND', 'Perfil no encontrado.'));
      return;
    }
    if (!supabaseAdapter) {
      response.status(503).json(apiError('SUPABASE_NOT_CONNECTED', 'Supabase no está conectado.'));
      return;
    }

    const body = request.body as Record<string, unknown>;
    const allowedKeys = new Set(['avatar', 'autonomyLevel', 'systemInstructions']);
    if (Object.keys(body).some(key => !allowedKeys.has(key))) {
      response.status(400).json(apiError('INVALID_PROFILE', 'La actualización contiene campos no permitidos.'));
      return;
    }

    const avatar = body.avatar;
    if (avatar !== undefined && (
      typeof avatar !== 'string' ||
      avatar.length > 180_000 ||
      (avatar !== '' && !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(avatar))
    )) {
      response.status(400).json(apiError('INVALID_AVATAR', 'La imagen debe ser PNG, JPEG o WebP y no exceder 180 KB.'));
      return;
    }

    const autonomyLevel = body.autonomyLevel;
    if (autonomyLevel !== undefined && !['supervisado', 'semi-autonomo', 'autonomo'].includes(String(autonomyLevel))) {
      response.status(400).json(apiError('INVALID_PROFILE', 'Nivel de autonomía inválido.'));
      return;
    }

    const systemInstructions = body.systemInstructions;
    if (systemInstructions !== undefined && (
      typeof systemInstructions !== 'string' ||
      systemInstructions.trim().length < 1 ||
      systemInstructions.length > 4_000
    )) {
      response.status(400).json(apiError('INVALID_PROFILE', 'Las instrucciones deben contener entre 1 y 4000 caracteres.'));
      return;
    }

    try {
      const rows = await supabaseAdapter.upsertAgentProfile({
        role: baseProfile.id,
        ...(avatar !== undefined ? { avatar_data_url: avatar } : {}),
        ...(autonomyLevel !== undefined ? { autonomy_level: autonomyLevel } : {}),
        ...(systemInstructions !== undefined ? { system_instructions: systemInstructions } : {})
      });
      const saved = rows[0] ?? {};
      response.status(200).json({
        ...baseProfile,
        avatar: typeof saved.avatar_data_url === 'string' ? saved.avatar_data_url : baseProfile.avatar,
        autonomyLevel: typeof saved.autonomy_level === 'string' ? saved.autonomy_level : baseProfile.autonomyLevel,
        systemInstructions: typeof saved.system_instructions === 'string' ? saved.system_instructions : baseProfile.systemInstructions
      });
    } catch (error) {
      const denied = error instanceof SupabaseConsoleError && error.code === 'DENIED';
      response.status(denied ? 400 : 503).json(apiError(
        denied ? 'INVALID_PROFILE' : 'PROFILE_STORAGE_UNAVAILABLE',
        denied ? 'El perfil fue rechazado.' : 'No fue posible guardar el perfil.'
      ));
    }
  });
  app.get(`${API_PREFIX}/hermes/boards`, requireSession, hermesRead(() => hermesAdapter!.listBoards()));
  app.get(`${API_PREFIX}/hermes/tasks`, requireSession, hermesRead(() => hermesAdapter!.listTasks()));
  app.get(`${API_PREFIX}/hermes/boards/:board/tasks/:id`, requireSession, (request, response) =>
    hermesRead(() => hermesAdapter!.getTask(request.params.board, request.params.id))(request, response)
  );
  app.get(`${API_PREFIX}/hermes/boards/:board/tasks/:id/runs`, requireSession, (request, response) =>
    hermesRead(() => hermesAdapter!.getRuns(request.params.board, request.params.id))(request, response)
  );
  app.get(`${API_PREFIX}/tasks`, requireSession, hermesUnavailable);
  app.get(`${API_PREFIX}/tasks/:id`, requireSession, hermesUnavailable);
  app.get(`${API_PREFIX}/tasks/:id/runs`, requireSession, hermesUnavailable);
  const consoleUnavailable = (_request: Request, response: Response) => {
    response.status(503).json(
      apiError('SUPABASE_NOT_CONNECTED', 'Supabase aún no está conectado a NUGA Console API.')
    );
  };
  const consoleOperation = (
    operation: () => Promise<unknown>
  ) => async (_request: Request, response: Response) => {
    if (!supabaseAdapter) {
      consoleUnavailable(_request, response);
      return;
    }
    try {
      response.status(200).json(await operation());
    } catch (error) {
      const denied = error instanceof SupabaseConsoleError && error.code === 'DENIED';
      response.status(denied ? 400 : 503).json(
        apiError(
          denied ? 'VALIDATION_ERROR' : 'SUPABASE_UNAVAILABLE',
          denied ? 'El identificador solicitado no es válido.' : 'La persistencia de NUGA Console no está disponible.'
        )
      );
    }
  };

  app.get(`${API_PREFIX}/console/task-extensions/:board/:taskId`, requireSession, (request, response) =>
    consoleOperation(() => supabaseAdapter!.getTaskExtension(request.params.board, request.params.taskId))(request, response)
  );
  app.get(`${API_PREFIX}/console/task-extensions`, requireSession,
    consoleOperation(() => supabaseAdapter!.listTaskExtensions())
  );
  app.put(`${API_PREFIX}/console/task-extensions/:board/:taskId`, requireSession, requireCsrf, (request, response) =>
    consoleOperation(() => supabaseAdapter!.upsertTaskExtension({
      ...(request.body as Record<string, unknown>),
      hermes_board_slug: request.params.board,
      hermes_task_id: request.params.taskId
    }))(request, response)
  );
  app.get(`${API_PREFIX}/decisions`, requireSession, consoleOperation(() => supabaseAdapter!.list('decisions')));
  app.post(`${API_PREFIX}/decisions`, requireSession, requireCsrf, (request, response) =>
    consoleOperation(() => supabaseAdapter!.create('decisions', request.body as Record<string, unknown>))(request, response)
  );
  app.get(`${API_PREFIX}/deliverables`, requireSession, consoleOperation(() => supabaseAdapter!.list('deliverables')));
  app.post(`${API_PREFIX}/deliverables`, requireSession, requireCsrf, (request, response) =>
    consoleOperation(() => supabaseAdapter!.create('deliverables', request.body as Record<string, unknown>))(request, response)
  );
  app.get(`${API_PREFIX}/audit/events`, requireSession, consoleOperation(() => supabaseAdapter!.list('audit_events')));

  app.post(`${API_PREFIX}/ai/writing-assist`, requireSession, requireCsrf, async (request, response) => {
    if (!writingAdapter) {
      response.status(503).json(apiError('AI_WRITING_NOT_CONFIGURED', 'La asistencia de escritura no está configurada.'));
      return;
    }

    const body = request.body as Record<string, unknown>;
    const allowedContexts: WritingContext[] = ['project_objective', 'campaign_objective', 'admin_notes'];
    const context = body.context;
    const draft = typeof body.draft === 'string' ? body.draft.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : undefined;
    const category = typeof body.category === 'string' ? body.category.trim() : undefined;
    if (!allowedContexts.includes(context as WritingContext) || draft.length < 10 || draft.length > 2_000) {
      response.status(400).json(apiError('INVALID_WRITING_REQUEST', 'El borrador debe contener entre 10 y 2000 caracteres.'));
      return;
    }
    if ((title?.length ?? 0) > 200 || (category?.length ?? 0) > 100) {
      response.status(400).json(apiError('INVALID_WRITING_REQUEST', 'El contexto excede el límite permitido.'));
      return;
    }

    const now = Date.now();
    while (writingRequestTimes.length && writingRequestTimes[0] < now - 300_000) {
      writingRequestTimes.shift();
    }
    if (writingRequestTimes.length >= 20) {
      response.status(429).json(apiError('AI_RATE_LIMITED', 'Se alcanzó el límite temporal de asistencia de escritura.'));
      return;
    }
    writingRequestTimes.push(now);

    try {
      const suggestion = await writingAdapter.improve({
        context: context as WritingContext,
        draft,
        title,
        category
      });
      const correlationId = response.getHeader('x-request-id')?.toString() || randomUUID();
      if (supabaseAdapter) {
        try {
          await supabaseAdapter.create('audit_events', {
            actor: config.ownerUsername,
            action: 'ai_writing_assistance_requested',
            resource_type: 'writing_assistance',
            resource_id: context,
            outcome: 'success',
            risk: 'low',
            correlation_id: correlationId,
            details: {
              provider: 'minimax',
              model: config.minimaxModel,
              input_characters: draft.length,
              output_characters: suggestion.length
            }
          });
        } catch {
          // The suggestion remains usable; audit storage health is reported elsewhere.
        }
      }
      response.status(200).json({ suggestion, provider: 'minimax', model: config.minimaxModel });
    } catch (error) {
      const invalid = error instanceof MiniMaxWritingError && error.code === 'INVALID_RESPONSE';
      response.status(503).json(apiError(
        invalid ? 'AI_INVALID_RESPONSE' : 'AI_UNAVAILABLE',
        invalid ? 'La IA devolvió una sugerencia inválida.' : 'La asistencia de escritura no está disponible.'
      ));
    }
  });

  const mapProjectInput = (body: Record<string, unknown>) => ({
    code: body.code,
    name: body.name,
    category: body.category,
    objective: body.objective,
    owner: body.owner,
    team: body.team,
    status: body.status,
    progress_percent: body.progressPercent,
    start_date: body.startDate,
    target_end_date: body.targetEndDate,
    risks: body.risks,
    milestones: body.milestones,
    budget_estimate_usd: body.budgetEstimateUsd,
    summary_executive: body.summaryExecutive,
    deliverables_count: body.deliverablesCount
  });
  const mapCampaignInput = (body: Record<string, unknown>) => ({
    code: body.code,
    name: body.name,
    objective: body.objective,
    target_audience: body.targetAudience,
    value_proposition: body.valueProposition,
    channels: body.channels,
    budget_usd: body.simulatedBudgetUsd,
    spent_budget_usd: body.spentBudgetUsd,
    schedule_date_range: body.scheduleDateRange,
    status: body.status,
    creative_stage: body.creativeStage,
    variants_count: body.variantsCount,
    metrics: body.metrics,
    requires_approval: body.requiresApproval,
    assigned_agent: body.assignedAgent
  });
  const mapAdminInput = (body: Record<string, unknown>) => ({
    title: body.title,
    category: body.category,
    responsible: body.responsible,
    agent_assigned: body.agentAssigned,
    deadline: body.deadline,
    status: body.status,
    priority: body.priority,
    amount_usd: body.amountUsd,
    evidence_ref: body.evidenceRef,
    notes: body.notes
  });
  const mapProjectOutput = (row: Record<string, unknown>) => ({
    id: row.id, code: row.code, name: row.name, category: row.category,
    objective: row.objective, owner: row.owner, team: row.team, status: row.status,
    progressPercent: row.progress_percent, startDate: row.start_date,
    targetEndDate: row.target_end_date, risks: row.risks, milestones: row.milestones,
    budgetEstimateUsd: row.budget_estimate_usd, summaryExecutive: row.summary_executive,
    deliverablesCount: row.deliverables_count, isDemo: false
  });
  const mapCampaignOutput = (row: Record<string, unknown>) => ({
    id: row.id, code: row.code, name: row.name, objective: row.objective,
    targetAudience: row.target_audience, valueProposition: row.value_proposition,
    channels: row.channels, simulatedBudgetUsd: row.budget_usd,
    spentBudgetUsd: row.spent_budget_usd, scheduleDateRange: row.schedule_date_range,
    status: row.status, creativeStage: row.creative_stage,
    variantsCount: row.variants_count, metrics: row.metrics,
    requiresApproval: row.requires_approval, assignedAgent: row.assigned_agent,
    isDemo: false
  });
  const mapAdminOutput = (row: Record<string, unknown>) => ({
    id: row.id, title: row.title, category: row.category,
    responsible: row.responsible, agentAssigned: row.agent_assigned,
    deadline: row.deadline, status: row.status, priority: row.priority,
    amountUsd: row.amount_usd, evidenceRef: row.evidence_ref,
    notes: row.notes, isDemo: false
  });

  app.get(`${API_PREFIX}/projects`, requireSession, consoleOperation(async () =>
    (await supabaseAdapter!.list('projects')).map(mapProjectOutput)
  ));
  app.post(`${API_PREFIX}/projects`, requireSession, requireCsrf, (request, response) =>
    consoleOperation(async () => mapProjectOutput((await supabaseAdapter!.create('projects', mapProjectInput(request.body as Record<string, unknown>)))[0]))(request, response)
  );
  app.get(`${API_PREFIX}/marketing/campaigns`, requireSession, consoleOperation(async () =>
    (await supabaseAdapter!.list('campaigns')).map(mapCampaignOutput)
  ));
  app.post(`${API_PREFIX}/marketing/campaigns`, requireSession, requireCsrf, (request, response) =>
    consoleOperation(async () => mapCampaignOutput((await supabaseAdapter!.create('campaigns', mapCampaignInput(request.body as Record<string, unknown>)))[0]))(request, response)
  );
  app.get(`${API_PREFIX}/admin/items`, requireSession, consoleOperation(async () =>
    (await supabaseAdapter!.list('admin_items')).map(mapAdminOutput)
  ));
  app.post(`${API_PREFIX}/admin/items`, requireSession, requireCsrf, (request, response) =>
    consoleOperation(async () => mapAdminOutput((await supabaseAdapter!.create('admin_items', mapAdminInput(request.body as Record<string, unknown>)))[0]))(request, response)
  );

  // Explicit read models for modules that are not connected yet. Returning an
  // authenticated empty collection prevents the browser from inventing DEMO
  // fixtures while keeping every external integration fail-closed.
  [
    `${API_PREFIX}/wisp/towers`,
    `${API_PREFIX}/wisp/routers`,
    `${API_PREFIX}/wisp/links`,
    `${API_PREFIX}/wisp/incidents`,
    `${API_PREFIX}/marketing/media-assets`,
    `${API_PREFIX}/conversations`,
    `${API_PREFIX}/notifications`
  ].forEach(path => {
    app.get(path, requireSession, (_request, response) => {
      response.status(200).json([]);
    });
  });

  app.get(`${API_PREFIX}/config/settings`, requireSession, (_request, response) => {
    response.status(200).json(SERVER_SETTINGS);
  });

  app.use(API_PREFIX, (_request, response) => {
    response.status(404).json(
      apiError('NOT_FOUND', 'Ruta API no encontrada.')
    );
  });

  app.use('/api', (_request, response) => {
    response.status(404).json(
      apiError('NOT_FOUND', 'Ruta API no encontrada.')
    );
  });

  if (frontendDirectory && existsSync(join(frontendDirectory, 'index.html'))) {
    app.use((_request, response, next) => {
      response.setHeader('content-security-policy', [
        "default-src 'self'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "object-src 'none'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "connect-src 'self'"
      ].join('; '));
      response.setHeader('referrer-policy', 'no-referrer');
      response.setHeader('x-content-type-options', 'nosniff');
      response.setHeader('x-frame-options', 'DENY');
      next();
    });
    app.use(express.static(frontendDirectory, {
      dotfiles: 'deny',
      fallthrough: true,
      index: false
    }));
    app.get('*', (_request, response) => {
      response.sendFile(join(frontendDirectory, 'index.html'));
    });
  }

  app.use(
    (
      _error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction
    ) => {
      response.status(400).json(
        apiError('VALIDATION_ERROR', 'La solicitud no contiene JSON válido.')
      );
    }
  );

  return app;
}
