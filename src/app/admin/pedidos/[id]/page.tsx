import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, DefinitionList, EmptyState, PageHeader } from "@/components/ui";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { admin } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/format";
import { cancellationReasonLabel, eventLabel } from "../labels";
import { OrderActionForm } from "./order-action-form";

/**
 * RF-W05.6 — espelho administrativo: linha do tempo composta, e **nunca** o código de entrega
 * (RF-21.9/RN-08.3) — o backend nem inclui o campo em `AdminOrderDetail`, então não há como esta
 * tela vazar o que a API não devolve.
 */
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await admin.order(id).catch((error) => {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  });
  if (!order) notFound();

  return (
    <div>
      <PageHeader
        title={`Pedido nº ${order.number}`}
        breadcrumbs={["UaiOu", "Administração", "Entregas", `nº ${order.number}`]}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid-2">
        <Card title="Estabelecimento">
          {order.merchant ? (
            <Link href={`/admin/usuarios/${order.merchant.id}`}>{order.merchant.name}</Link>
          ) : (
            <p>—</p>
          )}
        </Card>
        <Card title="Entregador">
          {order.courier ? (
            <Link href={`/admin/usuarios/${order.courier.id}`}>{order.courier.name}</Link>
          ) : (
            <p>Sem entregador atribuído</p>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Resumo">
          <DefinitionList
            items={[
              { term: "Criado em", value: formatDateTime(order.createdAt) },
              { term: "Frete proposto", value: formatMoney(order.proposedFee) },
              { term: "Frete final", value: formatMoney(order.finalFee) },
              ...(order.cancellation
                ? [
                    {
                      term: "Cancelamento",
                      value: `${cancellationReasonLabel(order.cancellation.reason)} · ${formatDateTime(order.cancellation.cancelledAt)}`,
                    },
                    ...(order.cancellation.note
                      ? [{ term: "Nota", value: order.cancellation.note }]
                      : []),
                  ]
                : []),
            ]}
          />
        </Card>

        <Card title="Alterar estado">
          {order.availableActions.length === 0 ? (
            <EmptyState title="Nenhuma ação disponível">
              <p>O pedido está em estado final.</p>
            </EmptyState>
          ) : (
            <OrderActionForm key={order.status} orderId={order.id} actions={order.availableActions} />
          )}
        </Card>
      </div>

      <Card title="Linha do tempo">
        {order.timeline.length === 0 ? (
          <EmptyState title="Sem eventos registrados" />
        ) : (
          <ul className="timeline">
            {order.timeline.map((event, index) => (
              <li key={index}>
                <p className="timeline-event">{eventLabel(event.event)}</p>
                <p className="timeline-time">{formatDateTime(event.at)}</p>
                {event.details && typeof event.details.reason === "string" ? (
                  <p className="small muted">
                    {typeof event.details.admin === "string" ? `${event.details.admin}: ` : ""}
                    {event.event === "order.cancelled"
                      ? cancellationReasonLabel(event.details.reason)
                      : event.details.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
