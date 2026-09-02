import { notFound } from "next/navigation";
import Link from "next/link";
import { Alert, Card, DefinitionList, PageHeader } from "@/components/ui";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { delivery, notifications, orders } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatElapsed, formatMoney } from "@/lib/format";
import { Counteroffers } from "./counteroffers";
import { DeliveryCode } from "./delivery-code";
import { ContingencyAlert } from "./contingency-alert";
import { OpenTicketButton } from "./open-ticket-button";
import { PollOnFocus } from "./poll-on-focus";

/**
 * RF-W02.5 — detalhe do pedido: dados, entregador atribuído (nome — o score não é exposto fora do
 * contexto de decisão, RF-20.8), e as ações que a API realmente oferece.
 *
 * RF-W02.8 exige a tela reagir ao aceite sem recarga manual; como não há WebSocket, `PollOnFocus`
 * chama `router.refresh()` ao focar a janela e num intervalo curto — suficiente para "o
 * estabelecimento vê o aceite chegar" sem inventar infraestrutura de tempo real.
 */
/** Número do pedido na aba: acompanhar duas entregas em paralelo é o caso normal aqui. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await orders.get(id).catch(() => null);
  return { title: order ? `Pedido nº ${order.number}` : "Pedido" };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await orders.get(id).catch((error) => {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  });
  if (!order) notFound();

  const negotiating = order.status === "published" || order.status === "in_negotiation";
  const counteroffers = negotiating ? await orders.counteroffers(id) : [];

  const showCode = order.status === "accepted";
  let codeGone = false;
  const code = showCode
    ? await delivery.code(id).catch((error) => {
        // RF-W03.8 — corrida rara: a entrega finalizou entre o carregamento da lista e esta
        // requisição. O código já não existe mais para ser lido; não é erro, é o ciclo de vida dele.
        if (error instanceof ApiError && error.isGone) {
          codeGone = true;
          return null;
        }
        return null;
      })
    : null;

  // RF-W03.3 — não há rota de leitura da contingência para o estabelecimento; a fonte do prazo é a
  // própria notificação urgente que o degrau 2 dispara (payload: orderId + deadline).
  const contingency =
    showCode && code?.status !== "blocked"
      ? await findContingencyDeadline(id)
      : null;

  return (
    <div>
      <PollOnFocus />

      <PageHeader
        title={`Pedido nº ${order.number}`}
        description={`Criado ${formatElapsed(order.createdAt)}`}
        breadcrumbs={["UaiOu", "Estabelecimento", "Pedidos", `nº ${order.number}`]}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid-2">
        <Card title="Dados do pedido">
          <DefinitionList
            items={[
              { term: "Frete proposto", value: formatMoney(order.proposedFee) },
              {
                term: "Frete final",
                value: order.finalFee ? formatMoney(order.finalFee) : "—",
              },
              {
                term: "Entrega prevista",
                value: order.expectedDeliveryAt ? formatDateTime(order.expectedDeliveryAt) : "—",
              },
              {
                term: "Destino",
                value: `${order.destination.street ?? ""} ${order.destination.number ?? ""}, ${order.destination.district}`,
              },
              { term: "Recebedor", value: order.receiver?.name ?? "—" },
              {
                term: "Telefone do recebedor",
                value: order.receiver?.phone ?? "não informado",
              },
              { term: "Créditos consumidos", value: String(order.creditsConsumed) },
            ]}
          />
        </Card>

        <Card title="Entregador">
          {order.courier ? (
            <p>{order.courier.name}</p>
          ) : (
            <p className="muted">
              {negotiating ? "Ainda sem entregador atribuído." : "Nenhum entregador nesta entrega."}
            </p>
          )}
        </Card>
      </div>

      {negotiating ? (
        <Counteroffers
          orderId={order.id}
          counteroffers={counteroffers}
          proposedFee={order.proposedFee}
          decidable={negotiating}
        />
      ) : null}

      {code ? <DeliveryCode orderNumber={order.number} code={code} /> : null}

      {codeGone ? (
        <Card title="Código de entrega">
          <p className="muted">
            Esta entrega acabou de ser finalizada — o código não está mais disponível para leitura.
            Atualize a página para ver a situação atual.
          </p>
        </Card>
      ) : null}

      {contingency ? (
        <ContingencyAlert
          orderId={order.id}
          deadlineAt={contingency.deadline}
          receiverPhone={order.receiver?.phone ?? null}
        />
      ) : null}

      {order.status === "finalized" ? (
        <Card title="Entrega finalizada">
          <p>Finalizada com código validado pelo entregador.</p>
        </Card>
      ) : null}

      {order.status === "contestable_finalized" ? (
        <Card title="Entrega finalizada sem código (contestável)">
          {/* RF-W03.6 — o contrato ainda não expõe foto/histórico de contingência ao
              estabelecimento (só o espelho administrativo tem, em admin.md); mostrar o que existe
              de verdade é melhor que inventar um dado que a API não devolve. */}
          <Alert tone="warning" title="Sem código validado nesta entrega">
            <p>
              O entregador não conseguiu repassar o código e finalizou por foto após a contingência
              se esgotar. Se a entrega não chegou como esperado, abra um chamado — é a única via de
              contestação nesta versão.
            </p>
          </Alert>
          <div style={{ marginTop: "var(--space-3)" }}>
            <OpenTicketButton orderId={order.id} orderNumber={order.number} />
          </div>
        </Card>
      ) : null}

      <p className="small" style={{ marginTop: "var(--space-4)" }}>
        <Link href="/merchant/pedidos">Voltar para a lista</Link>
      </p>
    </div>
  );
}

async function findContingencyDeadline(orderId: string): Promise<{ deadline: string } | null> {
  const list = await notifications.byType("delivery.code_contingency").catch(() => null);
  if (!list) return null;
  const match = list.data.find((n) => !n.readAt && n.payload["orderId"] === orderId);
  if (!match) return null;
  const deadline = match.payload["deadline"];
  return typeof deadline === "string" ? { deadline } : null;
}
