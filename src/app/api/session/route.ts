import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/api/server";
import { toApiError } from "@/lib/api/errors";
import type { Role, SessionResponse } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
  serializeSession,
} from "@/lib/session";

/**
 * RF-W01.3 — a troca de credencial por token acontece AQUI, no servidor. O formulário de login
 * manda usuário e senha para esta rota; ela fala com o backend e devolve ao navegador apenas
 * cookies `httpOnly`. O token nunca transita por JavaScript do cliente (critério de aceite 2).
 */

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

interface PasswordLogin {
  grantType: "password";
  login: string;
  password: string;
  role: Role;
}

interface GoogleLogin {
  grantType: "google";
  idToken: string;
  role: Role;
}

type LoginRequest = PasswordLogin | GoogleLogin;

function isLoginRequest(value: unknown): value is LoginRequest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.role !== "string") return false;
  if (candidate.grantType === "password") {
    return typeof candidate.login === "string" && typeof candidate.password === "string";
  }
  if (candidate.grantType === "google") {
    return typeof candidate.idToken === "string";
  }
  return false;
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload: unknown = await request.json().catch(() => null);
  if (!isLoginRequest(payload)) {
    return NextResponse.json(
      { error: { code: "MALFORMED_REQUEST", message: "Dados de login incompletos." } },
      { status: 400 },
    );
  }

  const upstream = await fetch(backendUrl("/auth/sessions"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      {
        error: {
          code: "NETWORK_ERROR",
          message: "Não foi possível falar com o servidor. Tente novamente.",
        },
      },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : null;

  if (!upstream.ok) {
    // Repassa o envelope do backend intacto: a tela precisa distinguir 403 de conta suspensa
    // (com motivo e prazo) de 422 de papel errado no toggle.
    const error = toApiError(upstream.status, body);
    return NextResponse.json(
      { error: { code: error.code, message: error.message, rule: error.rule } },
      { status: upstream.status },
    );
  }

  const session = body as SessionResponse;
  const response = NextResponse.json({ user: session.user });

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...COOKIE_BASE,
    maxAge: session.expiresIn,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...COOKIE_BASE,
    // O refresh vive muito além do access: é ele que sustenta "lembrar da senha" (auth.md).
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(SESSION_COOKIE, serializeSession(session.user, session.expiresIn), {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

/** Logout — revoga o refresh no backend e apaga os três cookies, aconteça o que acontecer lá. */
export async function DELETE(request: Request): Promise<NextResponse> {
  const accessToken = extractCookie(request.headers.get("cookie"), ACCESS_TOKEN_COOKIE);

  if (accessToken) {
    await fetch(backendUrl("/auth/sessions/current"), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }).catch(() => null);
  }

  const response = NextResponse.json({ ok: true });
  // Apagar localmente mesmo se o backend falhou: manter o cookie depois de o usuário pedir para
  // sair seria o pior desfecho — ele acredita que saiu e a sessão continua no aparelho.
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE]) {
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0 });
  }
  return response;
}

function extractCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}
