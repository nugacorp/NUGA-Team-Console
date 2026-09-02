export type ServerMode = 'staging' | 'production';

export interface ServerConfig {
  mode: ServerMode;
  host: string;
  port: number;
  publicOrigin: string;
  sessionSecret: string;
  ownerUsername: string;
  ownerPasswordHash: string;
  hermesReadOnlyEnabled: boolean;
  hermesBinary: string;
  hermesBoards: string[];
  supabaseEnabled: boolean;
  supabaseUrl: string;
  supabaseSecretKey: string;
  supabaseSchema: 'nuga_console' | 'nuga_console_production';
  aiWritingEnabled: boolean;
  minimaxPythonBinary: string;
  hermesSourceDirectory: string;
  minimaxModel: string;
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

  const hermesReadOnlyEnabled = environment.NUGA_HERMES_READ_ONLY_ENABLED === 'true';
  const hermesBoards = (environment.NUGA_HERMES_BOARDS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (hermesReadOnlyEnabled && !hermesBoards.length) {
    throw new ServerConfigurationError(
      'NUGA_HERMES_BOARDS es obligatorio cuando la lectura Hermes está habilitada.'
    );
  }

  const supabaseEnabled = environment.NUGA_SUPABASE_ENABLED === 'true';
  const supabaseUrl = environment.NUGA_SUPABASE_URL?.trim() ?? '';
  const supabaseSecretKey = environment.NUGA_SUPABASE_SECRET_KEY?.trim() ?? '';
  const expectedSupabaseSchema = environment.NUGA_SERVER_MODE === 'production'
    ? 'nuga_console_production'
    : 'nuga_console';
  const supabaseSchema = environment.NUGA_SUPABASE_SCHEMA?.trim() ?? '';
  if (supabaseEnabled) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(supabaseUrl);
    } catch {
      throw new ServerConfigurationError(
        'NUGA_SUPABASE_URL debe ser una URL HTTPS válida.'
      );
    }
    if (parsedUrl.protocol !== 'https:') {
      throw new ServerConfigurationError('NUGA_SUPABASE_URL debe usar HTTPS.');
    }
    if (!supabaseSecretKey.startsWith('sb_secret_')) {
      throw new ServerConfigurationError(
        'NUGA_SUPABASE_SECRET_KEY debe contener una clave secreta moderna de Supabase.'
      );
    }
    if (supabaseSchema !== expectedSupabaseSchema) {
      throw new ServerConfigurationError(
        `NUGA_SUPABASE_SCHEMA debe ser ${expectedSupabaseSchema} en modo ${environment.NUGA_SERVER_MODE}.`
      );
    }
  }

  const aiWritingEnabled = environment.NUGA_AI_WRITING_ENABLED === 'true';
  const minimaxPythonBinary = environment.NUGA_MINIMAX_PYTHON?.trim() || '/usr/bin/python3';
  const hermesSourceDirectory = environment.NUGA_HERMES_SOURCE_DIRECTORY?.trim() || '/home/ramiro/.hermes/hermes-agent';
  const minimaxModel = environment.NUGA_MINIMAX_MODEL?.trim() || 'MiniMax-M3';
  if (aiWritingEnabled) {
    if (!minimaxPythonBinary.startsWith('/') || !hermesSourceDirectory.startsWith('/')) throw new ServerConfigurationError('Las rutas Hermes OAuth deben ser absolutas.');
  }

  return {
    mode: parseServerMode(environment.NUGA_SERVER_MODE),
    host: environment.NUGA_SERVER_HOST || '127.0.0.1',
    port: parsePort(environment.NUGA_SERVER_PORT),
    publicOrigin: parseOrigin(environment.NUGA_PUBLIC_ORIGIN),
    sessionSecret,
    ownerUsername,
    ownerPasswordHash,
    hermesReadOnlyEnabled,
    hermesBinary: environment.NUGA_HERMES_BINARY || '/home/ramiro/.local/bin/hermes',
    hermesBoards,
    supabaseEnabled,
    supabaseUrl,
    supabaseSecretKey,
    supabaseSchema: expectedSupabaseSchema,
    aiWritingEnabled,
    minimaxPythonBinary,
    hermesSourceDirectory,
    minimaxModel,
  };
}
