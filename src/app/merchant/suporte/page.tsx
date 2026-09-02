import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { tickets } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/format";
import { Icon } from "@/components/icons";
import { ticketStatus } from "@/lib/status";

export const metadata = { title: "Suporte" };

export default async function TicketsPage() {
  const list = await tickets.list();

  return (
    <div>
      <PageHeader
        title="Suporte"
        description="Seus chamados abertos e o histórico de atendimento."
        breadcrumbs={["UaiOu", "Estabelecimento", "Suporte"]}
        action={
          <Link className="btn" href="/merchant/suporte/novo">
            <Icon.Plus size={15} /> Novo chamado
          </Link>
        }
      />

      <Card>
        {list.length === 0 ? (
          <EmptyState title="Nenhum chamado aberto">
            <p className="small">Precisa de ajuda? Abra um chamado.</p>
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Assunto</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Aberto em</th>
                </tr>
              </thead>
              <tbody>
                {list.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/merchant/suporte/${ticket.id}`}>{ticket.subject}</Link>
                    </td>
                    <td>
                      <Badge tone={ticketStatus(ticket.status).tone}>{ticketStatus(ticket.status).label}</Badge>
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
