import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, Badge, Card, PageHeader } from "@/components/ui";
import { admin, tickets } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ReplyForm, ResolveForm } from "./ticket-actions";

/**
 * RF-W05.4 — o contexto da `reference` aparece ao lado, sem busca manual: se o chamado referencia
 * um pedido, este pedido já vem carregado. RF-W05.5 — contestação vira alerta em destaque.
 */
export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await tickets.get(id).catch((error) => {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  });
  if (!ticket) notFound();

  const referencedOrder =
    ticket.referenceType === "order" && ticket.referenceId
      ? await admin.order(ticket.referenceId).catch(() => null)
      : null;

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`Aberto por ${ticket.authorName ?? "—"}`}
        breadcrumbs={["UaiOu", "Administração", "Suporte", "Chamado"]}
        action={
          <Badge tone={ticket.status === "resolved" ? "success" : "warning"}>{ticket.status}</Badge>
        }
      />

      {ticket.contestedDelivery ? (
        <Alert tone="warning" title="Entrega finalizada sem código — contestável">
          <p className="small">
            Este chamado se refere a uma entrega que terminou sem validação de código. Veja a foto
            e o histórico de contingência no pedido referenciado antes de responder.
          </p>
        </Alert>
      ) : null}

      {referencedOrder ? (
        <Card title={`Pedido nº ${referencedOrder.number}`}>
          <p className="small">
            Situação: {referencedOrder.status} · Frete final:{" "}
            {formatMoney(referencedOrder.finalFee)}
          </p>
          <Link className="btn secondary small" href={`/admin/pedidos/${referencedOrder.id}`}>
            Ver detalhe do pedido
          </Link>
        </Card>
      ) : null}

      <Card>
        <div className="stack">
          {ticket.messages.map((message) => (
            <div
              key={message.id}
              className={message.isAdmin ? "card" : ""}
              style={{ padding: "var(--space-3)" }}
            >
              <p className="muted small">
                {message.isAdmin ? "Suporte" : message.authorName ?? "Usuário"} ·{" "}
                {formatDateTime(message.createdAt)}
              </p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        {ticket.status !== "resolved" ? (
          <>
            <ReplyForm ticketId={ticket.id} />
            <div style={{ marginTop: "var(--space-3)" }}>
              <ResolveForm ticketId={ticket.id} />
            </div>
          </>
        ) : (
          <p className="muted small" style={{ marginTop: "var(--space-3)" }}>
            Chamado resolvido {ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : ""}.
          </p>
        )}
      </Card>
    </div>
  );
}
