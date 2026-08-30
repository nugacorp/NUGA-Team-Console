import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from 'node:crypto';

const PASSWORD_PREFIX = 'scrypt-v1';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface AuthSession {
  subject: string;
  role: 'owner';
  issuedAt: number;
  expiresAt: number;
  csrfToken: string;
}

interface SessionPayload {
  sub: string;
  role: 'owner';
  iat: number;
  exp: number;
  csrf: string;
}

function encode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function decode(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

export function createPasswordHash(
  password: string,
  salt: Buffer = randomBytes(16)
): string {
  if (password.length < 12) {
    throw new Error('La contraseña debe contener al menos 12 caracteres.');
  }

  const derivedKey = scryptSync(password, salt, 64);
  return [
    PASSWORD_PREFIX,
    encode(salt),
    encode(derivedKey)
  ].join('$');
}

export function verifyPassword(
  password: string,
  storedHash: string
): boolean {
  const [prefix, saltText, hashText, extra] = storedHash.split('$');
  if (prefix !== PASSWORD_PREFIX || !saltText || !hashText || extra) return false;

  try {
    const expected = decode(hashText);
    const actual = scryptSync(password, decode(saltText), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');
}

export function createSessionToken(
  subject: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): { token: string; session: AuthSession } {
  const payload: SessionPayload = {
    sub: subject,
    role: 'owner',
    iat: nowSeconds,
    exp: nowSeconds + SESSION_TTL_SECONDS,
    csrf: randomBytes(24).toString('base64url')
  };

  const encodedPayload = encode(JSON.stringify(payload));
  const token = `${encodedPayload}.${sign(encodedPayload, secret)}`;

  return {
    token,
    session: {
      subject: payload.sub,
      role: payload.role,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
      csrfToken: payload.csrf
    }
  };
}

export function verifySessionToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): AuthSession | null {
  const [encodedPayload, encodedSignature, extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra) return null;

  const expectedSignature = Buffer.from(sign(encodedPayload, secret));
  const receivedSignature = Buffer.from(encodedSignature);
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null;
  }

  try {
    const value = JSON.parse(decode(encodedPayload).toString('utf8')) as Partial<SessionPayload>;
    if (
      typeof value.sub !== 'string' ||
      value.role !== 'owner' ||
      typeof value.iat !== 'number' ||
      typeof value.exp !== 'number' ||
      typeof value.csrf !== 'string' ||
      value.exp <= nowSeconds ||
      value.iat > nowSeconds + 60
    ) {
      return null;
    }

    return {
      subject: value.sub,
      role: value.role,
      issuedAt: value.iat,
      expiresAt: value.exp,
      csrfToken: value.csrf
    };
  } catch {
    return null;
  }
}

export function parseCookie(
  cookieHeader: string | undefined,
  name: string
): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key === name) return valueParts.join('=') || null;
  }

  return null;
}

export function serializeSessionCookie(
  token: string,
  secure: boolean
): string {
  const attributes = [
    `nuga_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`
  ];

  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export function serializeExpiredSessionCookie(secure: boolean): string {
  const attributes = [
    'nuga_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0'
  ];

  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}
