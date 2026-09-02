import { notFound } from "next/navigation";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { tickets } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";
import { ReplyForm } from "./reply-form";
import { ticketStatus } from "@/lib/status";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ticket = await tickets.get(id).catch((error) => {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  });
  if (!ticket) notFound();

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        breadcrumbs={["UaiOu", "Estabelecimento", "Suporte", "Chamado"]}
        action={
          <StatusBadge tone={ticketStatus(ticket.status).tone}>
            {ticketStatus(ticket.status).label}
          </StatusBadge>
        }
      />

      <Card>
        <div className="stack">
          {ticket.messages.map((message) => (
            <div key={message.id} className={message.isAdmin ? "card" : ""} style={{ padding: "var(--space-3)" }}>
              <p className="muted small">
                {message.isAdmin ? "Suporte" : message.authorName ?? "Você"} ·{" "}
                {formatDateTime(message.createdAt)}
              </p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        {ticket.status !== "resolved" ? <ReplyForm ticketId={ticket.id} /> : (
          <p className="muted small" style={{ marginTop: "var(--space-3)" }}>
            Este chamado já foi resolvido.
          </p>
        )}
      </Card>
    </div>
  );
}
