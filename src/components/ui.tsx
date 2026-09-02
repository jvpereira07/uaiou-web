import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api/errors";
import { Icon } from "@/components/icons";

/**
 * RF-W01.7 — componentes base, no contrato do 7Days DS (`ui.jsx` + `global.jsx`).
 *
 * Server Components por padrão: só vira `"use client"` o que realmente precisa de interatividade
 * (formulários, polling, contagem regressiva).
 */

export function Card({
  title,
  action,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="card-title">
          {typeof title === "string" ? <h2>{title}</h2> : title}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** StatCard do DS: rótulo pequeno + ícone na mesma linha, número grande tabular abaixo. */
export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="stat">
      <div className="stat-head">
        <p className="stat-label">{label}</p>
        {icon}
      </div>
      <p className="stat-value">{value}</p>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </div>
  );
}

/**
 * PageHeader do DS: migalhas, título, descrição e ação, com régua embaixo.
 *
 * As migalhas são opcionais porque nem toda tela deste produto está aninhada — inventar
 * "Início › Usuários" numa tela de primeiro nível seria decoração, não orientação.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  action,
}: {
  title: string;
  description?: ReactNode;
  breadcrumbs?: string[];
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {breadcrumbs.length > 0 ? (
          <nav className="page-breadcrumbs" aria-label="Trilha de navegação">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb} className="row" style={{ gap: 4 }}>
                <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>
                  {crumb}
                </span>
                {index < breadcrumbs.length - 1 ? (
                  <Icon.ChevronRight size={13} style={{ opacity: 0.5 }} />
                ) : null}
              </span>
            ))}
          </nav>
        ) : null}
        <h1>{title}</h1>
        {description ? <p className="page-subtitle">{description}</p> : null}
      </div>
      {action ? <div className="row">{action}</div> : null}
    </div>
  );
}

export type AlertTone = "error" | "warning" | "info" | "success";

/** Ícone por tom, como no `alertVariants` do DS — cor sozinha não é sinal acessível. */
const ALERT_ICON = {
  error: Icon.Alert,
  warning: Icon.Alert,
  info: Icon.Info,
  success: Icon.CheckCircle,
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  rule,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  rule?: string | null;
}) {
  const Glyph = ALERT_ICON[tone];

  return (
    <div className={`alert ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Glyph size={17} className="alert-icon" />
      <div>
        {title ? <p className="alert-title">{title}</p> : null}
        {children}
        {/* RF-W01.6 — a RN de origem aparece só em desenvolvimento: para o usuário final é ruído,
            mas para quem está depurando é o elo direto com a documentação. */}
        {rule && process.env.NODE_ENV !== "production" ? (
          <p className="alert-rule">regra: {rule}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * RF-W01.6 — tradução do erro de API para a tela. 422 mostra a mensagem de negócio como ela veio
 * (o backend já escreve em português e explica a ação), nunca "algo deu errado".
 */
export function ApiErrorAlert({ error }: { error: ApiError }) {
  const tone: AlertTone = error.isConflict ? "warning" : "error";
  const title = error.isConflict
    ? "O estado mudou enquanto você olhava"
    : error.isForbidden
      ? "Sem permissão para esta ação"
      : undefined;

  return (
    <Alert tone={tone} title={title} rule={error.rule}>
      <p>{error.message}</p>
      {error.isConflict ? (
        <p className="small">Recarregue a página para ver a situação atual.</p>
      ) : null}
    </Alert>
  );
}

/** EmptyState do DS: moldura tracejada, ícone em círculo, título e descrição. */
export function EmptyState({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon ?? <Icon.Inbox size={22} />}</span>
      <div>
        <h3>{title}</h3>
        {/* `div`, não `p`: vários chamadores já passam um `<p>` como descrição, e `<p>` dentro de
            `<p>` é HTML inválido — o navegador fecha o primeiro sozinho, a árvore do servidor
            deixa de bater com a do cliente e a hidratação falha. */}
        {children ? <div className="empty-state-body">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge ${tone === "neutral" ? "" : tone}`}>{children}</span>;
}

/**
 * StatusBadge do DS — pílula com ponto colorido.
 *
 * Diferente do `Badge` genérico de propósito: este existe para colunas de estado, onde uma dezena
 * de linhas é varrida de relance. O ponto dá a leitura antes da palavra, e sobrevive a quem não
 * distingue as cores entre si.
 */
export function StatusBadge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`badge status-badge ${tone === "neutral" ? "" : tone}`}>
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * RF-W01.7 — paginação lida do `meta` do contrato (critério de aceite 7). Sem `total` não há como
 * saber se existe próxima página; o componente usa exatamente o que a API devolveu.
 */
export function Pagination({
  page,
  perPage,
  total,
  baseHref,
}: {
  page: number;
  perPage: number;
  total: number;
  baseHref: string;
}) {
  const totalPages = perPage > 0 ? Math.ceil(total / perPage) : 0;
  if (totalPages <= 1) return null;

  const separator = baseHref.includes("?") ? "&" : "?";
  const href = (target: number) => `${baseHref}${separator}page=${target}&perPage=${perPage}`;

  // Layout do `DataTablePagination` do DS: contagem à esquerda, controles à direita, setas em
  // botões-ícone. Sem seletor de "linhas por página" — `perPage` vem da URL e do contrato da API,
  // não de um estado de cliente que a próxima navegação perderia.
  return (
    <nav className="pagination spread" aria-label="Paginação">
      <span>
        {total} {total === 1 ? "registro" : "registros"}
      </span>
      <span className="row">
        <span className="mono small">
          Página {page} de {totalPages}
        </span>
        {page > 1 ? (
          <a className="btn secondary small" href={href(page - 1)} aria-label="Página anterior">
            <Icon.ChevronLeft size={15} />
          </a>
        ) : null}
        {page < totalPages ? (
          <a className="btn secondary small" href={href(page + 1)} aria-label="Próxima página">
            <Icon.ChevronRight size={15} />
          </a>
        ) : null}
      </span>
    </nav>
  );
}

export function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="field" data-invalid={error ? "true" : "false"}>
      {/* RF-W01.10 — todo controle tem rótulo associado por `htmlFor`/`id`, não por placeholder. */}
      <label htmlFor={name}>{label}</label>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function DefinitionList({ items }: { items: { term: string; value: ReactNode }[] }) {
  return (
    <div className="stack">
      {items.map((item) => (
        <div key={item.term} className="spread">
          <span className="muted small">{item.term}</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
