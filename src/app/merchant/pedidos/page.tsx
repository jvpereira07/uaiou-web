import Link from "next/link";
import type { Route } from "next";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ApiErrorAlert, Card, EmptyState, PageHeader, Pagination } from "@/components/ui";
import { orders } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { OrderStatus } from "@/lib/api/types";
import { cutoffFrom, formatDateTime, formatMoney } from "@/lib/format";
import { Icon } from "@/components/icons";

export const metadata = { title: "Pedidos" };

/**
 * RF-W02.4 — lista com filtro por status e período.
 *
 * O filtro roda no cliente sobre a página carregada: `GET /orders` do estabelecimento devolve todos
 * os status sem parâmetro de recorte (pedidos.md — `status` só recorta o escopo do ENTREGADOR).
 * Filtrar aqui é honesto com o contrato; inventar `?status=` faria a interface prometer um
 * comportamento que o backend não tem.
 */
const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "in_negotiation", label: "Em negociação" },
  { value: "accepted", label: "Aceitos" },
  { value: "finalized", label: "Finalizados" },
  { value: "contestable_finalized", label: "Sem código" },
];

const PERIOD_FILTERS: { value: string; label: string; days: number | null }[] = [
  { value: "", label: "Todo o período", days: null },
  { value: "7", label: "Últimos 7 dias", days: 7 },
  { value: "30", label: "Últimos 30 dias", days: 30 },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string; status?: string; period?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const perPage = Number(params.perPage ?? "20") || 20;
  const statusFilter = params.status ?? "";
  const periodFilter = params.period ?? "";

  let result;
  try {
    result = await orders.listForMerchant({ page, perPage });
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        <>
          <Header />
          <ApiErrorAlert error={error} />
        </>
      );
    }
    throw error;
  }

  const periodDays = PERIOD_FILTERS.find((entry) => entry.value === periodFilter)?.days ?? null;
  const cutoff = periodDays === null ? null : cutoffFrom(periodDays);

  const visible = result.data.filter((order) => {
    if (statusFilter && order.status !== (statusFilter as OrderStatus)) return false;
    if (cutoff !== null && new Date(order.createdAt).getTime() < cutoff) return false;
    return true;
  });

  const filterHref = (next: { status?: string; period?: string }) => {
    const search = new URLSearchParams();
    const status = next.status ?? statusFilter;
    const period = next.period ?? periodFilter;
    if (status) search.set("status", status);
    if (period) search.set("period", period);
    const rendered = search.toString();
    // `typedRoutes` só valida caminhos estáticos; a query é montada em runtime a partir do filtro.
    return `/merchant/pedidos${rendered ? `?${rendered}` : ""}` as Route;
  };

  return (
    <>
      <Header />

      {/* Dois conjuntos fechados e exclusivos: TabsList do DS, não fileiras de botões. Fora de um
          `Card` porque filtro não é conteúdo — é o controle do conteúdo que vem abaixo. */}
      <div className="row" style={{ gap: "var(--space-3)" }}>
        <nav className="tabs" aria-label="Filtrar por situação">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value || "all"}
              href={filterHref({ status: filter.value })}
              aria-current={statusFilter === filter.value ? "page" : undefined}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
        <nav className="tabs" aria-label="Filtrar por período">
          {PERIOD_FILTERS.map((filter) => (
            <Link
              key={filter.value || "always"}
              href={filterHref({ period: filter.value })}
              aria-current={periodFilter === filter.value ? "page" : undefined}
            >
              {filter.label}
            </Link>
          ))}
        </nav>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState title="Nenhum pedido neste recorte">
            <p className="small">Ajuste os filtros ou publique um novo pedido.</p>
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <caption className="muted small" style={{ captionSide: "bottom", textAlign: "left" }}>
                {visible.length} de {result.meta.total} pedidos
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nº</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Destino</th>
                  <th scope="col" className="numeric">
                    Frete
                  </th>
                  <th scope="col">Criado em</th>
                  <th scope="col">
                    <span className="muted">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr key={order.id}>
                    <td className="mono">{order.number}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td>
                      {order.destination.street ? (
                        <>
                          {order.destination.street}, {order.destination.number}
                          <br />
                        </>
                      ) : null}
                      <span className="muted small">{order.destination.district}</span>
                    </td>
                    <td className="numeric">{formatMoney(order.proposedFee)}</td>
                    <td className="small">{formatDateTime(order.createdAt)}</td>
                    <td>
                      <Link className="btn secondary small" href={`/merchant/pedidos/${order.id}`}>
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={result.meta.page}
          perPage={result.meta.perPage}
          total={result.meta.total}
          baseHref={filterHref({})}
        />
      </Card>
    </>
  );
}

function Header() {
  return (
    <PageHeader
      title="Pedidos"
      description="Acompanhe a publicação, a negociação e a entrega."
      breadcrumbs={["UaiOu", "Estabelecimento", "Pedidos"]}
      action={
        <Link className="btn" href="/merchant/pedidos/novo">
          <Icon.Plus size={15} /> Novo pedido
        </Link>
      }
    />
  );
}
