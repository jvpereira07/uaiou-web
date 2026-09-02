import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { tickets } from "@/lib/api/endpoints";
import type { TicketStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { ticketStatus } from "@/lib/status";

export const metadata = { title: "Suporte" };

const STATUS_FILTERS: { value: TicketStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "open", label: "Abertos" },
  { value: "in_progress", label: "Em andamento" },
  { value: "resolved", label: "Resolvidos" },
];

/** RF-W05.4/RF-W05.5 — fila com filtro; contestações destacadas para não precisar procurar. */
export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const list = await tickets.list(status ? { status } : {});

  return (
    <div>
      <PageHeader
        title="Suporte"
        description="Chamados abertos por estabelecimentos e entregadores."
        breadcrumbs={["UaiOu", "Administração", "Suporte"]}
      />

      <nav className="tabs" aria-label="Filtrar por situação" style={{ marginBottom: "var(--space-4)" }}>
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value || "all"}
            href={filter.value ? `/admin/suporte?status=${filter.value}` : "/admin/suporte"}
            aria-current={status === filter.value ? "page" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <Card>
        {list.length === 0 ? (
          <EmptyState title="Nenhum chamado neste filtro" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Assunto</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Aberto em</th>
                </tr>
              </thead>
              <tbody>
                {list.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/admin/suporte/${ticket.id}`}>{ticket.subject}</Link>
                      {ticket.contestedDelivery ? (
                        <>
                          {" "}
                          <Badge tone="danger">Entrega contestável</Badge>
                        </>
                      ) : null}
                    </td>
                    <td className="small">{ticket.authorName ?? "—"}</td>
                    <td>
                      <StatusBadge tone={ticketStatus(ticket.status).tone}>
                        {ticketStatus(ticket.status).label}
                      </StatusBadge>
                    </td>
                    <td className="small">{formatDateTime(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
