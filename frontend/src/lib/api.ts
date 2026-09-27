import {
  clearAuthToken,
  getAuthToken,
  notifySessionExpired,
  SESSION_EXPIRED_MESSAGE,
} from "./token.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

const CONNECTION_ERROR_MESSAGE =
  "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

export class SessionExpiredError extends Error {
  constructor() {
    super(SESSION_EXPIRED_MESSAGE);
  }
}

function authHeaders(token: string | null): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function errorMessage(body: unknown, status: number): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return `Erro inesperado no servidor (HTTP ${status})`;
}

function expireSession(sentToken: string): never {
  if (getAuthToken() === sentToken) {
    clearAuthToken();
    notifySessionExpired();
  }
  throw new SessionExpiredError();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();

  let response: Response;
  let body: unknown;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(token), ...options?.headers },
    });
    body = await parseBody(response);
  } catch (cause) {
    // Falha de rede/CORS/DNS: motivo original fica em `cause` para debug no console.
    throw new Error(CONNECTION_ERROR_MESSAGE, { cause });
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      expireSession(token);
    }
    throw new Error(errorMessage(body, response.status));
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, {
      body: JSON.stringify(data),
      method: "PATCH",
    }),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, {
      body: JSON.stringify(data),
      method: "POST",
    }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, {
      body: JSON.stringify(data),
      method: "PUT",
    }),
};
