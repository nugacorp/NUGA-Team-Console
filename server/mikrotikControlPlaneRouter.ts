import express, { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { parseCookie, verifySessionToken } from './auth';
import { ServerConfig } from './config';
import {
  apiError,
  isAllowedOrigin,
  validateModeHeader
} from './contracts';
import {
  buildMikroTikRouterEnrollmentPlan,
  buildMikroTikTechnicalChangePlan,
  MIKROTIK_CONTROL_PLANE_POLICY,
  MikroTikControlPlaneValidationError,
  MikroTikRouterEnrollmentPlanInput,
  MikroTikTechnicalChangePlanInput
} from '../src/networkControl';

function requestGuard(config: ServerConfig) {
  return (request: Request, response: Response, next: NextFunction) => {
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

    const token = parseCookie(request.header('cookie'), 'nuga_session');
    const session = token ? verifySessionToken(token, config.sessionSecret) : null;
    if (!session || session.subject !== config.ownerUsername) {
      response.status(401).json(apiError('UNAUTHORIZED', 'No existe una sesión válida.', correlationId));
      return;
    }

    response.locals.authSession = session;
    next();
  };
}

function csrfGuard(config: ServerConfig) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!isAllowedOrigin(config.publicOrigin, request.header('origin'))) {
      response.status(403).json(apiError('ORIGIN_DENIED', 'El origen de la solicitud no está autorizado.'));
      return;
    }

    const session = response.locals.authSession as { csrfToken?: string } | undefined;
    if (!session?.csrfToken || request.header('x-csrf-token') !== session.csrfToken) {
      response.status(403).json(apiError('CSRF_DENIED', 'La validación CSRF falló.'));
      return;
    }

    next();
  };
}

function planError(error: unknown, response: Response, code: string) {
  if (error instanceof MikroTikControlPlaneValidationError) {
    response.status(400).json(apiError(code, error.message));
    return true;
  }
  return false;
}

export function createMikrotikControlPlaneRouter(config: ServerConfig) {
  const router = express.Router();
  const requireRequest = requestGuard(config);
  const requireCsrf = csrfGuard(config);

  router.get('/control-plane', requireRequest, (_request, response) => {
    response.status(200).json(MIKROTIK_CONTROL_PLANE_POLICY);
  });

  router.post(
    '/routers/enrollment/plan',
    express.json({ limit: '32kb', strict: true }),
    requireRequest,
    requireCsrf,
    (request, response) => {
      try {
        const body = request.body as Partial<MikroTikRouterEnrollmentPlanInput>;
        const plan = buildMikroTikRouterEnrollmentPlan({
          routerId: typeof body.routerId === 'string' ? body.routerId.trim() : '',
          displayName: typeof body.displayName === 'string' ? body.displayName.trim() : '',
          privateHost: typeof body.privateHost === 'string' ? body.privateHost.trim() : '',
          routerOsMajor: body.routerOsMajor as MikroTikRouterEnrollmentPlanInput['routerOsMajor'],
          managementInterface: typeof body.managementInterface === 'string'
            ? body.managementInterface.trim()
            : undefined,
          isEdgeRouter: body.isEdgeRouter === true
        });
        response.status(200).json(plan);
      } catch (error) {
        if (planError(error, response, 'INVALID_MIKROTIK_ENROLLMENT_PLAN')) return;
        throw error;
      }
    }
  );

  router.post(
    '/technical-changes/plan',
    express.json({ limit: '32kb', strict: true }),
    requireRequest,
    requireCsrf,
    (request, response) => {
      try {
        const body = request.body as Partial<MikroTikTechnicalChangePlanInput>;
        const plan = buildMikroTikTechnicalChangePlan({
          routerId: typeof body.routerId === 'string' ? body.routerId.trim() : '',
          category: body.category as MikroTikTechnicalChangePlanInput['category'],
          objective: typeof body.objective === 'string' ? body.objective.trim() : ''
        });
        response.status(200).json(plan);
      } catch (error) {
        if (planError(error, response, 'INVALID_MIKROTIK_TECHNICAL_PLAN')) return;
        throw error;
      }
    }
  );

  router.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError) {
      response.status(400).json(apiError('VALIDATION_ERROR', 'La solicitud no contiene JSON válido.'));
      return;
    }
    response.status(500).json(apiError('CONTROL_PLANE_ERROR', 'No fue posible preparar el plan MikroTik.'));
  });

  return router;
}
