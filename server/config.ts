export type ServerMode = 'staging' | 'production';

export interface ServerConfig {
  mode: ServerMode;
  host: string;
  port: number;
  publicOrigin: string;
  sessionSecret: string;
  ownerUsername: string;
  ownerPasswordHash: string;
}

export class ServerConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerConfigurationError';
  }
}

export function parseServerMode(value: string | undefined): ServerMode {
  if (value === 'staging' || value === 'production') return value;

  throw new ServerConfigurationError(
    'NUGA_SERVER_MODE debe definirse explícitamente como staging o production.'
  );
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? '8787');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ServerConfigurationError('NUGA_SERVER_PORT debe ser un puerto TCP válido.');
  }
  return port;
}

function parseOrigin(value: string | undefined): string {
  if (!value) {
    throw new ServerConfigurationError('NUGA_PUBLIC_ORIGIN es obligatorio.');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ServerConfigurationError('NUGA_PUBLIC_ORIGIN debe ser una URL absoluta válida.');
  }

  if (
    url.protocol !== 'https:' &&
    url.hostname !== '127.0.0.1' &&
    url.hostname !== 'localhost'
  ) {
    throw new ServerConfigurationError(
      'NUGA_PUBLIC_ORIGIN debe usar HTTPS fuera del desarrollo local.'
    );
  }

  return url.origin;
}

export function loadServerConfig(
  environment: NodeJS.ProcessEnv = process.env
): ServerConfig {
  const sessionSecret = environment.NUGA_SESSION_SECRET ?? '';
  if (sessionSecret.length < 32) {
    throw new ServerConfigurationError(
      'NUGA_SESSION_SECRET debe existir y contener al menos 32 caracteres.'
    );
  }

  const ownerUsername = environment.NUGA_OWNER_USERNAME?.trim() ?? '';
  const ownerPasswordHash = environment.NUGA_OWNER_PASSWORD_HASH?.trim() ?? '';

  if (!ownerUsername) {
    throw new ServerConfigurationError('NUGA_OWNER_USERNAME es obligatorio.');
  }
  if (!ownerPasswordHash.startsWith("scrypt-v1$")) {
    throw new ServerConfigurationError(
      'NUGA_OWNER_PASSWORD_HASH debe contener un hash scrypt-v1 válido.'
    );
  }

  return {
    mode: parseServerMode(environment.NUGA_SERVER_MODE),
    host: environment.NUGA_SERVER_HOST || '127.0.0.1',
    port: parsePort(environment.NUGA_SERVER_PORT),
    publicOrigin: parseOrigin(environment.NUGA_PUBLIC_ORIGIN),
    sessionSecret,
    ownerUsername,
    ownerPasswordHash
  };
}
