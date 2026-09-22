const TOKEN_STORAGE_KEY = "sales-pipeline.token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const SESSION_EXPIRED_EVENT = "session-expired";
export const SESSION_EXPIRED_MESSAGE = "Sessão expirada. Faça login novamente.";

export function notifySessionExpired(): void {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
