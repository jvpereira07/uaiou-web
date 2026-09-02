/**
 * RF-W01.2/RF-W01.6 — o envelope de erro do contrato (api/README.md) vira erro TIPADO numa camada
 * só. Nenhuma tela inspeciona `response.status` na mão: ela pergunta `err.code` / `err.status`.
 */

/** Corpo de erro do contrato: `{ error: { code, message, rule?, details? } }`. */
export interface ErrorBody {
  code: string;
  message: string;
  rule?: string | null;
  details?: Record<string, unknown> | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly rule: string | null;
  readonly details: Record<string, unknown> | null;

  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.rule = body.rule ?? null;
    this.details = body.details ?? null;
  }

  /** 401 — o chamador tenta refresh antes de desistir (RF-W01.6). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** 403 — papel/status sem permissão; a mensagem já explica o motivo. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * 409 — o estado mudou por concorrência (ex.: contraoferta invalidada por aceite alheio).
   * RF-W02.7: isso é situação NORMAL do fluxo, não falha — a tela recarrega e explica.
   */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** 422 — regra de negócio; `rule` aponta a RN de origem. */
  get isBusinessRule(): boolean {
    return this.status === 422;
  }

  /** 410 — código consumido/expirado após finalização (RF-W03.8): esperado, não falha. */
  get isGone(): boolean {
    return this.status === 410;
  }
}

/** Erro de transporte (rede caiu, backend fora do ar) — distinto de erro de negócio. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super("Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.code === "string" && typeof candidate.message === "string";
}

/**
 * Extrai o envelope do corpo. Um 500 sem corpo JSON ainda precisa virar ApiError — senão a tela
 * recebe `undefined` e quebra num lugar sem contexto nenhum.
 */
export function toApiError(status: number, payload: unknown): ApiError {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const inner = (payload as { error: unknown }).error;
    if (isErrorBody(inner)) return new ApiError(status, inner);
  }
  return new ApiError(status, {
    code: "UNEXPECTED_ERROR",
    message: "Não foi possível concluir a operação. Tente novamente em instantes.",
  });
}
