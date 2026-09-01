let csrfToken = '';

export function setApiCsrfToken(value?: string): void {
  csrfToken = value ?? '';
}

export function getApiCsrfToken(): string {
  return csrfToken;
}
