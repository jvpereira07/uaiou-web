import Link from "next/link";
import { Card, EmptyState, PageHeader, Pagination, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { admin } from "@/lib/api/endpoints";
import { formatDateTime, formatMoney } from "@/lib/format";
import { OVERVIEW_STATUSES, STATUS_FILTERS, TIMEOUT_RULES, cancellationReasonLabel } from "./labels";
import type { TimeoutRule } from "@/lib/api/types";

export const metadata = { title: "Entregas" };

/**
 * Histórico de entregas do sistema inteiro. Filtros vivem na URL (form GET), não em estado de
 * cliente: um link copiado para outro admin abre exatamente o mesmo recorte.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const perPage = Number(params.perPage ?? "30") || 30;
  const status = params.status ?? "";
  const search = params.q?.trim() ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";

  const [orders, overview] = await Promise.all([
    admin.orders({
      status: status || undefined,
      search: search || undefined,
      // `date` do input é dia local; o contrato quer instante. Início do dia / início do dia seguinte.
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? nextDayIso(to) : undefined,
      page,
      perPage,
    }),
    admin.ordersOverview(),
  ]);

  const filterQuery = new URLSearchParams();
  if (status) filterQuery.set("status", status);
  if (search) filterQuery.set("q", search);
  if (from) filterQuery.set("from", from);
  if (to) filterQuery.set("to", to);
  const baseHref = filterQuery.size ? `/admin/pedidos?${filterQuery}` : "/admin/pedidos";

  const overdueTotal = Object.values(overview.overdue).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Entregas"
        description="Histórico de todos os pedidos da plataforma. Abra um pedido para ver a linha do tempo e intervir no estado."
        breadcrumbs={["UaiOu", "Administração", "Entregas"]}
        action={
          <Link className="btn secondary small" href="/admin/timeouts">
            Timeouts
          </Link>
        }
      />

      <div className="grid-3">
        {OVERVIEW_STATUSES.map(({ status: s, label }) => (
          <Stat key={s} label={label} value={overview.byStatus[s] ?? 0} />
        ))}
        <Stat
          label="Acima do prazo"
          value={overdueTotal}
          icon={overdueTotal > 0 ? <Icon.Alert size={16} /> : undefined}
          hint={(Object.keys(overview.overdue) as TimeoutRule[])
            .map((rule) => `${TIMEOUT_RULES[rule]?.label ?? rule}: ${overview.overdue[rule] ?? 0}`)
            .join(" · ")}
        />
      </div>

      <Card>
        <form className="form-row">
          <input name="q" defaultValue={search} placeholder="Nº do pedido ou bairro" aria-label="Busca" />
          <select name="status" defaultValue={status} aria-label="Status">
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={from} aria-label="Criado a partir de" />
          <input type="date" name="to" defaultValue={to} aria-label="Criado até" />
          <button className="btn" type="submit">
            <Icon.Search size={15} /> Filtrar
          </button>
        </form>
      </Card>

      <Card>
        {orders.data.length === 0 ? (
          <EmptyState title="Nenhuma entrega neste filtro" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Status</th>
                  <th scope="col">Estabelecimento</th>
                  <th scope="col">Entregador</th>
                  <th scope="col">Bairro</th>
                  <th scope="col" className="numeric">
                    Frete
                  </th>
                  <th scope="col">Criado</th>
                  <th scope="col">Encerrado</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((order) => (
                  <tr key={order.id}>
                    <td className="mono small">
                      <Link href={`/admin/pedidos/${order.id}`}>nº {order.number}</Link>
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="small">{order.merchant?.name ?? "—"}</td>
                    <td className="small">{order.courier?.name ?? "—"}</td>
                    <td className="small">{order.neighborhood ?? "—"}</td>
                    <td className="numeric small">
                      {formatMoney(order.finalFee ?? order.proposedFee)}
                    </td>
                    <td className="small">{formatDateTime(order.createdAt)}</td>
                    <td className="small">
                      {order.cancelledAt
                        ? `${formatDateTime(order.cancelledAt)} · ${cancellationReasonLabel(order.cancellationReason)}`
                        : order.finalizedAt
                          ? formatDateTime(order.finalizedAt)
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={orders.meta.page}
          perPage={orders.meta.perPage}
          total={orders.meta.total}
          baseHref={baseHref}
        />
      </Card>
    </div>
  );
}

function nextDayIso(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}
