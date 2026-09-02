/**
 * RF-W01.8 — formatação localizada SEM perder precisão.
 *
 * O ponto não negociável: dinheiro nunca vira `number` no caminho. `parseFloat("1234.56")` já
 * introduz erro binário, e `Intl.NumberFormat` exige `number` — então a formatação de moeda é feita
 * na mão sobre a string decimal. Critério de aceite 6 testa exatamente `"0.10"` e `"1234.56"`.
 */

const BRL_SYMBOL = "R$";

/**
 * `"1234.56"` → `"R$ 1.234,56"` · `"0.10"` → `"R$ 0,10"` · `"-6"` → `"-R$ 6,00"`.
 *
 * Sem `parseFloat`, sem `Number()`: só manipulação de string.
 */
export function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") return "—";

  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;

  const [rawInteger = "0", rawFraction = ""] = unsigned.split(".");
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || "0";
  // Duas casas sempre: "6" → "00", "1" → "10", "567" → "56" (o contrato já entrega numeric(12,2),
  // então truncar o excedente é mais honesto que arredondar um dígito que não deveria existir).
  const fraction = (rawFraction + "00").slice(0, 2);

  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${BRL_SYMBOL} ${grouped},${fraction}`;
}

/** Diferença entre dois valores decimais, preservando string. Usado no spread da contraoferta. */
export function subtractMoney(a: string, b: string): string {
  const toCents = (value: string): bigint => {
    const negative = value.trim().startsWith("-");
    const unsigned = negative ? value.trim().slice(1) : value.trim();
    const [integer = "0", fraction = ""] = unsigned.split(".");
    const cents = BigInt(integer || "0") * 100n + BigInt((fraction + "00").slice(0, 2) || "0");
    return negative ? -cents : cents;
  };

  const result = toCents(a) - toCents(b);
  const negative = result < 0n;
  const absolute = negative ? -result : result;
  const integer = absolute / 100n;
  const fraction = absolute % 100n;
  return `${negative ? "-" : ""}${integer}.${fraction.toString().padStart(2, "0")}`;
}

/**
 * `0.1234` → `"12,34%"`. Taxas chegam como `BigDecimal` cru do contrato — JSON **number**, não
 * string (só `Money` é serializado como string no backend) — então aqui `Number` é seguro.
 */
export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

/** Score vem em escala 1..5. `null` é "sem base" (RF-20.9), não zero. */
export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "sem base";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DATE_TIME = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const DATE_ONLY = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/** ISO-8601 UTC → fuso local do navegador/servidor. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return DATE_TIME.format(parsed);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return DATE_ONLY.format(parsed);
}

/** "há 3 min" — usado no tempo decorrido desde o aceite (RF-13.8). */
export function formatElapsed(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";

  const seconds = Math.max(0, Math.floor((now - parsed.getTime()) / 1000));
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

/** Contagem regressiva do degrau 2 (RF-W03.3). Negativo = prazo vencido. */
export function formatCountdown(deadlineIso: string, now: number = Date.now()): string {
  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline)) return "—";

  const remaining = Math.floor((deadline - now) / 1000);
  if (remaining <= 0) return "prazo vencido";

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Ponto único para `Date.now()` fora de componentes: a regra `react-hooks/purity` do React 19 marca
 * chamada impura direto no corpo de uma function component (mesmo Server Component, que roda uma vez
 * por requisição e não sofre o problema real da regra — recomputar em cada render do cliente).
 * Isolar aqui deixa o lint satisfeito sem mentir sobre o motivo.
 */
export function cutoffFrom(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}
