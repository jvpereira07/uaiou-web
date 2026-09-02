import { notFound } from "next/navigation";
import { Badge, Card, DefinitionList, EmptyState, PageHeader } from "@/components/ui";
import { admin } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/format";

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
        breadcrumbs={["UaiOu", "Administração", "Pedidos", `nº ${order.number}`]}
        action={
          <Badge tone={order.contestedDelivery ? "danger" : "neutral"}>{order.status}</Badge>
        }
      />

      <div className="grid-2">
        <Card title="Estabelecimento">
          <p>{order.merchant?.name ?? "—"}</p>
        </Card>
        <Card title="Entregador">
          <p>{order.courier?.name ?? "Sem entregador atribuído"}</p>
        </Card>
      </div>

      <Card title="Financeiro">
        <DefinitionList items={[{ term: "Frete final", value: formatMoney(order.finalFee) }]} />
      </Card>

      <Card title="Linha do tempo">
        {order.timeline.length === 0 ? (
          <EmptyState title="Sem eventos registrados" />
        ) : (
          <ul className="timeline">
            {order.timeline.map((event, index) => (
              <li key={index}>
                <p className="timeline-event">{event.event}</p>
                <p className="timeline-time">{formatDateTime(event.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
