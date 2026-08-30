import express, {
  NextFunction,
  Request,
  Response
} from 'express';
import { randomUUID } from 'node:crypto';
import { ServerConfig } from './config';
import {
  apiError,
  createServerCapabilities,
  createServerStatusContract,
  isAllowedOrigin,
  isMutationMethod,
  validateModeHeader
} from './contracts';

const API_PREFIX = '/api/v1';

export function createApp(config: ServerConfig) {
  const app = express();

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
    response.status(200).json(createServerCapabilities(config.mode));
  });

  app.get(`${API_PREFIX}/auth/me`, (_request, response) => {
    response.status(401).json(
      apiError('UNAUTHORIZED', 'No existe una sesión autenticada.')
    );
  });

  const hermesUnavailable = (_request: Request, response: Response) => {
    response.status(503).json(
      apiError(
        'HERMES_NOT_CONNECTED',
        'Hermes aún no está conectado a NUGA Console API.'
      )
    );
  };

  app.get(`${API_PREFIX}/agents`, hermesUnavailable);
  app.get(`${API_PREFIX}/tasks`, hermesUnavailable);
  app.get(`${API_PREFIX}/tasks/:id`, hermesUnavailable);
  app.get(`${API_PREFIX}/tasks/:id/runs`, hermesUnavailable);
  app.get(`${API_PREFIX}/deliverables`, hermesUnavailable);
  app.get(`${API_PREFIX}/audit/events`, hermesUnavailable);

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
