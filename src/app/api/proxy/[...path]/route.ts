import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrl } from "@/lib/api/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/session";

/**
 * RF-W01.2/RF-W01.3 — ponte para o que precisa acontecer no NAVEGADOR (polling de RF-W02.8,
 * contagem regressiva de RF-W03.3). O cliente chama `/api/proxy/orders/…`; esta rota lê o token do
 * cookie httpOnly e encaminha ao backend.
 *
 * É o que torna possível "o cliente nunca vê o token" sem abrir mão de tela reativa: o componente
 * de cliente não consegue montar o `Authorization` nem se quiser, porque o valor não existe no
 * contexto dele.
 *
 * Só métodos de LEITURA passam por aqui. Escrita é Server Action — assim toda mutação tem um ponto
 * de entrada tipado no servidor, em vez de um túnel genérico que aceita qualquer corpo.
 */

async function forward(request: Request, path: string[]): Promise<NextResponse> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sessão expirada." } },
      { status: 401 },
    );
  }

  const search = new URL(request.url).search;
  const target = backendUrl(`/${path.join("/")}${search}`);

  const upstream = await fetch(target, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { error: { code: "NETWORK_ERROR", message: "Servidor indisponível." } },
      { status: 503 },
    );
  }

  const text = await upstream.text();
  return new NextResponse(text.length > 0 ? text : null, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  return forward(request, path);
}
