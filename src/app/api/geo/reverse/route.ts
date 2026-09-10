import { NextResponse } from "next/server";
import { api } from "@/lib/api/server";
import { ApiError } from "@/lib/api/errors";
import type { ReverseGeocodingResponse } from "@/lib/api/types";

/**
 * ===============================================================
 * SALTO 1 DO FLUXO DE ENDEREÇO — COORDENADA -> CEP
 * ===============================================================
 *
 * Repassa para `GET /geocoding/reverse` do backend, que é quem fala
 * com o Geoapify. A chave **não** vive aqui: ela já existe no backend
 * para as rotas de T-25 (`ROUTING_API_KEY`), e é chave de conta — uma
 * segunda cópia no web seria uma segunda chave para girar e esquecer,
 * além de cota do projeto exposta a quem abrisse o bundle.
 *
 * Esta rota existe, e não uma chamada direta do componente, porque o
 * token de sessão mora em cookie `httpOnly`: só o servidor Next
 * consegue lê-lo e assinar a chamada ao backend (RF-W01.2).
 *
 * O salto 2 (CEP -> endereço, ViaCEP) segue direto do cliente: é
 * anônimo, sem chave e sem cota, e não ganha nada passando por aqui.
 */

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ erro: "Coordenada inválida." }, { status: 400 });
  }

  try {
    const endereco = await api.get<ReverseGeocodingResponse>(
      `/geocoding/reverse?lat=${lat}&lng=${lng}`,
    );
    return NextResponse.json(endereco);
  } catch (cause) {
    // O backend distingue "não sei o endereço" (200 com campos nulos) de falha; aqui só sobra
    // falha mesmo. 502 e não 500: quem não respondeu foi o backend ou o provedor, e o cliente
    // usa essa diferença para escolher entre "não tem CEP aqui" e "não consegui perguntar".
    const status = cause instanceof ApiError ? cause.status : 502;
    return NextResponse.json(
      { erro: "Não foi possível consultar o endereço agora." },
      { status: status === 401 ? 401 : 502 },
    );
  }
}
