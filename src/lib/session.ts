import "server-only";

import { cookies } from "next/headers";
import type { Role, SessionUser, UserStatus } from "@/lib/api/types";

/**
 * RF-W01.3 — o token vive em cookie `httpOnly`, NUNCA em `localStorage`. O navegador não consegue
 * ler nenhum dos três: qualquer XSS que rode na página não alcança credencial.
 *
 * Por isso existe o proxy (`/api/proxy/[...path]`): o cliente não pode montar o header
 * `Authorization` porque não tem o token — quem monta é o servidor Next.
 */
export const ACCESS_TOKEN_COOKIE = "uaiou_at";
export const REFRESH_TOKEN_COOKIE = "uaiou_rt";
export const SESSION_COOKIE = "uaiou_session";

/**
 * O que o middleware precisa saber para rotear (RF-W01.4) sem ir ao banco a cada request.
 *
 * `expiresAt` existe para o middleware decidir renovar ANTES de o backend devolver 401 — decodificar
 * o JWT no cliente para descobrir isso seria tratar o token como dado legível, que é justamente o
 * que o cookie httpOnly evita.
 *
 * `status` aqui é conveniência de roteamento, não fonte de verdade: o backend reconsulta em toda
 * rota sensível (auth.md, item 5), então um usuário suspenso no meio da sessão é barrado lá, não
 * aqui.
 */
export interface SessionPayload {
  user: SessionUser;
  expiresAt: number;
}

export function serializeSession(user: SessionUser, expiresInSeconds: number): string {
  const payload: SessionPayload = {
    user,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
  return JSON.stringify(payload);
}

export function parseSession(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<SessionPayload>;
    const user = candidate.user;
    if (
      !user ||
      typeof user.id !== "string" ||
      typeof user.role !== "string" ||
      typeof user.status !== "string" ||
      typeof candidate.expiresAt !== "number"
    ) {
      return null;
    }
    return {
      user: {
        id: user.id,
        role: user.role as Role,
        status: user.status as UserStatus,
        displayName: typeof user.displayName === "string" ? user.displayName : "",
      },
      expiresAt: candidate.expiresAt,
    };
  } catch {
    // Cookie corrompido ou de uma versão anterior do formato: trata como "sem sessão" em vez de
    // derrubar a renderização. O usuário refaz o login, que é o pior caso aceitável aqui.
    return null;
  }
}

/** Sessão do request atual, para Server Components. `null` = não autenticado. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return parseSession(store.get(SESSION_COOKIE)?.value);
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

/** Sessão obrigatória — usada por páginas que o middleware já garantiu estarem protegidas. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    // Chegar aqui significa que o middleware deixou passar algo que não devia; falhar alto é
    // melhor que renderizar uma tela vazia sem explicação.
    throw new Error("Sessão ausente numa rota protegida — verifique o matcher do middleware.");
  }
  return session;
}
