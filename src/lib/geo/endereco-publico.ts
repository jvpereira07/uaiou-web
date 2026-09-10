/**
 * ===============================================================
 * ENDEREÇO POR COORDENADA — APIS PÚBLICAS
 * ===============================================================
 *
 * Dois saltos encadeados — espelho do
 * `repositorio_endereco_publico.dart` do app Flutter, para os dois
 * clientes preencherem o mesmo formulário do mesmo jeito:
 *
 *  1. **`GET /geocoding/reverse` do nosso backend** traduz o ponto
 *     clicado no mapa em um `postcode`. Quem fala com o Geoapify é o
 *     backend, com a mesma chave que ele já usa nas rotas de T-25 —
 *     nenhum cliente carrega chave de provedor. O caminho passa pela
 *     rota `/api/geo/reverse` deste app só porque o token de sessão
 *     mora em cookie `httpOnly`, ilegível para o navegador.
 *  2. **ViaCEP** (`viacep.com.br/ws/{cep}/json/`) troca esse CEP pelo
 *     endereço canônico dos Correios — rua, bairro, cidade e UF. Este
 *     continua no cliente: é anônimo, sem chave e sem cota.
 *
 * O segundo salto existe porque o geocodificador é bom em *localizar*
 * e fraco em *nomear*: devolve o que o mapa tem naquele ponto, que
 * varia de bairro para bairro. O ViaCEP devolve sempre a mesma grafia
 * oficial para um dado CEP.
 *
 * **Nada disto substitui a coordenada.** O pino continua sendo a fonte
 * de `lat`/`lng` enviados ao backend (que não geocodifica texto); o
 * endereço resolvido só preenche os campos de texto.
 */

export type EnderecoPublico = {
  /** Só dígitos — `31170000`, nunca `31170-000`. */
  cep: string;
  rua?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

export type ResultadoEndereco =
  | { status: "encontrado"; endereco: EnderecoPublico }
  /** O ponto existe, mas não tem CEP: zona rural, área sem mapeamento, meio de rodovia. */
  | { status: "sem-cep" }
  | { status: "falha"; mensagem: string };

const FALHA_DE_REDE =
  "Não foi possível consultar o endereço agora. Verifique a conexão.";

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarCep(cep: string): string {
  const digitos = apenasDigitos(cep);
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

function texto(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

export async function enderecoPorCoordenada(
  lat: number,
  lng: number,
  sinal?: AbortSignal,
): Promise<ResultadoEndereco> {
  let cep: string | null;
  try {
    cep = await cepPorCoordenada(lat, lng, sinal);
  } catch {
    return { status: "falha", mensagem: FALHA_DE_REDE };
  }
  if (!cep) return { status: "sem-cep" };

  try {
    const endereco = await enderecoPorCep(cep, sinal);
    // CEP que o geocodificador conhece e o ViaCEP não é comum (CEP
    // novo, ou o CEP geral de cidade pequena). Ainda assim temos o
    // CEP: devolvemos ele sozinho em vez de fingir que nada foi
    // encontrado.
    return { status: "encontrado", endereco: endereco ?? { cep } };
  } catch {
    return { status: "falha", mensagem: FALHA_DE_REDE };
  }
}

/**
 * Exposto separado porque também serve ao caminho inverso: o usuário
 * digita o CEP e o formulário completa o resto.
 */
export async function enderecoPorCep(
  cepBruto: string,
  sinal?: AbortSignal,
): Promise<EnderecoPublico | null> {
  const cep = apenasDigitos(cepBruto);
  if (cep.length !== 8) return null;

  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: sinal });
  if (!resposta.ok) return null;

  const corpo: unknown = await resposta.json();
  if (typeof corpo !== "object" || corpo === null) return null;

  const dados = corpo as Record<string, unknown>;
  // O ViaCEP responde `{"erro": true}` com **HTTP 200** para CEP
  // inexistente — o status não serve para decidir aqui.
  if (dados.erro === true || dados.erro === "true") return null;

  const cepResposta = apenasDigitos(String(dados.cep ?? ""));
  if (cepResposta.length !== 8) return null;

  return {
    cep: cepResposta,
    rua: texto(dados.logradouro),
    bairro: texto(dados.bairro),
    cidade: texto(dados.localidade),
    uf: texto(dados.uf),
  };
}

/**
 * Salto 1, via `/api/geo/reverse` -> backend -> Geoapify. Um
 * `!resposta.ok` aqui é falha de serviço e sobe como exceção; CEP
 * ausente é `null`, que é resposta legítima e vira "sem-cep" lá em
 * cima.
 */
async function cepPorCoordenada(
  lat: number,
  lng: number,
  sinal?: AbortSignal,
): Promise<string | null> {
  const resposta = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`, { signal: sinal });
  if (!resposta.ok) throw new Error(`reverse ${resposta.status}`);

  const corpo: unknown = await resposta.json();
  if (typeof corpo !== "object" || corpo === null) return null;

  const cep = apenasDigitos(String((corpo as { postalCode?: unknown }).postalCode ?? ""));
  return cep.length === 8 ? cep : null;
}
