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
import { SERVER_SETTINGS, TEAM_PROFILES } from './readModels';
import type { AgentProfile } from '../src/types';

const API_PREFIX = '/api/v1';

function getSession(response: Response): AuthSession | null {
  return (response.locals as { authSession?: AuthSession }).authSession ?? null;
}

export interface AppDependencies {
  hermesAdapter?: HermesReadOnlyAdapter;
  supabaseAdapter?: SupabaseConsoleAdapter;
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
  app.post(`${API_PREFIX}/audit/events`, requireSession, requireCsrf, (request, response) =>
    consoleOperation(() => supabaseAdapter!.create('audit_events', request.body as Record<string, unknown>))(request, response)
  );

  // Explicit read models for modules that are not connected yet. Returning an
  // authenticated empty collection prevents the browser from inventing DEMO
  // fixtures while keeping every external integration fail-closed.
  [
    `${API_PREFIX}/projects`,
    `${API_PREFIX}/wisp/towers`,
    `${API_PREFIX}/wisp/routers`,
    `${API_PREFIX}/wisp/links`,
    `${API_PREFIX}/wisp/incidents`,
    `${API_PREFIX}/marketing/campaigns`,
    `${API_PREFIX}/marketing/media-assets`,
    `${API_PREFIX}/conversations`,
    `${API_PREFIX}/admin/items`,
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
