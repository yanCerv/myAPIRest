const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface ParsedRefreshToken {
  sessionId: string;
  rawToken: string;
}

export function parseRefreshToken(token: string): ParsedRefreshToken | null {
  const [sessionId, secret, ...remaining] = token.split('.');

  if (
    remaining.length > 0 ||
    !sessionId ||
    !secret ||
    !SESSION_ID_PATTERN.test(sessionId) ||
    !SECRET_PATTERN.test(secret)
  ) {
    return null;
  }

  return { sessionId, rawToken: token };
}
