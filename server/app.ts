import express, {
  NextFunction,
  Request,
  Response
} from 'express';
import { randomUUID } from 'node:crypto';
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

const API_PREFIX = '/api/v1';

function getSession(response: Response): AuthSession | null {
  return (response.locals as { authSession?: AuthSession }).authSession ?? null;
}

export interface AppDependencies {
  hermesAdapter?: HermesReadOnlyAdapter;
  supabaseAdapter?: SupabaseConsoleAdapter;
}

export function createApp(config: ServerConfig, dependencies: AppDependencies = {}) {
  const app = express();
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

  app.get(`${API_PREFIX}/agents`, requireSession, hermesUnavailable);
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

  app.use(API_PREFIX, (_request, response) => {
    response.status(404).json(
      apiError('NOT_FOUND', 'Ruta API no encontrada.')
    );
  });

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
