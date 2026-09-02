import "server-only";

import { getAccessToken } from "@/lib/session";
import { NetworkError, toApiError } from "./errors";

/**
 * RF-W01.2 — camada ÚNICA de acesso à API para Server Components e Server Actions. Injeta o token
 * (lido do cookie httpOnly), interpreta o envelope de erro e devolve dado tipado ou lança
 * {@link ApiError}. Nenhuma tela chama `fetch` na API direto.
 *
 * O que este arquivo deliberadamente NÃO faz: refresh. Server Component não pode escrever cookie
 * durante a renderização, então renovar aqui produziria um token novo que se perderia no fim do
 * request. A renovação vive no middleware, que roda antes e controla a resposta — ver
 * `src/middleware.ts`.
 */

function baseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) {
    throw new Error(
      "API_BASE_URL não configurada. Copie .env.example para .env e aponte para o backend.",
    );
  }
  return url.replace(/\/+$/, "");
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * Dados de usuário autenticado nunca são cacheados por padrão: o painel precisa refletir o estado
   * atual, e um pedido aceito aparecendo com atraso é justamente o defeito que RF-W02.8 evita.
   */
  cache?: RequestCache;
  /** Sem token — só para as rotas públicas de auth. */
  anonymous?: boolean;
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, cache = "no-store", anonymous = false } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!anonymous) {
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      cache,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (cause) {
    throw new NetworkError(cause);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload: unknown = text.length > 0 ? safeJsonParse(text) : null;

  if (!response.ok) throw toApiError(response.status, payload);
  return payload as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

/** URL absoluta do backend — usada só pelo proxy e pelas rotas de sessão. */
export function backendUrl(path: string): string {
  return `${baseUrl()}${path}`;
}
