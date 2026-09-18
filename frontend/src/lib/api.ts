const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message ?? "Erro desconhecido");
  }

  return body as T;
}

export const api = {
  post: <T>(path: string, data: unknown) =>
    request<T>(path, {
      body: JSON.stringify(data),
      method: "POST",
    }),
};
