import { NextResponse, type NextRequest } from "next/server";
import type { SessionResponse } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
  parseSession,
  serializeSession,
} from "@/lib/session";

/**
 * RF-W01.3/RF-W01.4 — dois trabalhos que só o middleware consegue fazer:
 *
 * 1. **Refresh transparente.** É o único ponto do Next que roda antes da página E controla a
 *    resposta, então é o único que pode trocar o token e gravar o cookie novo. Fazer isso no Server
 *    Component não funciona: ele não pode escrever cookie durante a renderização, e o token
 *    renovado se perderia no fim do request.
 *
 * 2. **Roteamento por papel e status**, antes de qualquer dado carregar — usuário pendente não
 *    chega a disparar as consultas da tela de operação.
 */

const PUBLIC_PATHS = ["/login", "/registrar", "/cadastro-em-analise", "/conta-suspensa"];

/** Margem para renovar ANTES de o backend recusar: um 401 no meio do render vira tela quebrada. */
const REFRESH_SKEW_MS = 60_000;

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!session) {
    if (isPublic) return NextResponse.next();
    return redirectTo(request, "/login");
  }

  // Sessão viva mas perto de expirar: renova antes de seguir. Falha na renovação = deslogar, que é
  // melhor que deixar o usuário navegar até bater 401 numa tela qualquer (RF-W01.6).
  let response: NextResponse | null = null;
  if (Date.now() > session.expiresAt - REFRESH_SKEW_MS) {
    const refreshed = await refresh(request);
    if (!refreshed) return clearSessionAndRedirect(request);
    response = refreshed;
  }

  const { role, status } = session.user;

  // RF-W01.4: cadastro em análise e conta suspensa têm tela própria e não alcançam operação.
  if (status === "pending" || status === "rejected") {
    return pathname.startsWith("/cadastro-em-analise")
      ? (response ?? NextResponse.next())
      : redirectTo(request, "/cadastro-em-analise", response);
  }
  if (status === "suspended" || status === "banned") {
    return pathname.startsWith("/conta-suspensa")
      ? (response ?? NextResponse.next())
      : redirectTo(request, "/conta-suspensa", response);
  }

  // Já autenticado e ativo: /login não faz mais sentido.
  if (pathname === "/login") return redirectTo(request, homeFor(role), response);

  // Separação de áreas — estabelecimento em /admin e admin em /merchant são o mesmo erro.
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return redirectTo(request, homeFor(role), response);
  }
  if (pathname.startsWith("/merchant") && role !== "MERCHANT") {
    return redirectTo(request, homeFor(role), response);
  }

  // O entregador não tem cliente web (backlog: pendência aberta). Melhor dizer isso do que deixá-lo
  // num painel vazio que nunca vai funcionar.
  if (role === "COURIER" && !pathname.startsWith("/sem-painel-web")) {
    return redirectTo(request, "/sem-painel-web", response);
  }

  if (pathname === "/") return redirectTo(request, homeFor(role), response);

  return response ?? NextResponse.next();
}

function homeFor(role: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "MERCHANT") return "/merchant";
  return "/sem-painel-web";
}

function redirectTo(request: NextRequest, path: string, carry?: NextResponse | null): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const response = NextResponse.redirect(url);
  // Preserva os cookies renovados: sem isso, um refresh que coincide com um redirecionamento
  // gravaria o token novo e o jogaria fora no mesmo passo.
  if (carry) {
    for (const cookie of carry.cookies.getAll()) response.cookies.set(cookie);
  }
  return response;
}

function clearSessionAndRedirect(request: NextRequest): NextResponse {
  const response = redirectTo(request, "/login");
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE]) {
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0 });
  }
  return response;
}

/**
 * Rotação de refresh (auth.md, item 6): o backend revoga o anterior ao emitir o novo, então guardar
 * os dois é obrigatório — perder o refresh novo derrubaria a sessão na próxima renovação.
 */
async function refresh(request: NextRequest): Promise<NextResponse | null> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;

  const base = process.env.API_BASE_URL;
  if (!base) return null;

  const upstream = await fetch(`${base.replace(/\/+$/, "")}/auth/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ grantType: "refresh", refreshToken }),
    cache: "no-store",
  }).catch(() => null);

  if (!upstream || !upstream.ok) return null;

  const session = (await upstream.json()) as SessionResponse;
  const response = NextResponse.next();

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...COOKIE_BASE,
    maxAge: session.expiresIn,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(SESSION_COOKIE, serializeSession(session.user, session.expiresIn), {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export const config = {
  // As rotas de API do próprio Next ficam de fora: `/api/session` PRECISA rodar sem sessão (é ela
  // que cria a sessão), e o proxy já valida o token por conta própria.
  //
  // `[^?]*\\.[^/?]+$` tira da frente qualquer arquivo estático de `public/` — o logotipo em
  // `/uaiou-logo.png` casava com o matcher antigo, era tratado como página protegida e voltava
  // redirecionado para `/login`: o navegador recebia HTML no lugar da imagem e a marca não
  // aparecia em tela nenhuma.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|[^?]*\\.[^/?]+$).*)"],
};
