"use server";

import { revalidatePath } from "next/cache";
import { delivery, orders, tickets } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface ActionState {
  status: "idle" | "ok" | "error";
  message?: string;
  rule?: string | null;
  /** RF-W02.7 — 409 é fluxo normal (aceite alheio chegou primeiro), não falha. */
  staleState?: boolean;
}

function handle(error: unknown, conflictMessage: string): ActionState {
  if (error instanceof ApiError) {
    if (error.isConflict) {
      return { status: "error", message: conflictMessage, rule: error.rule, staleState: true };
    }
    return { status: "error", message: error.message, rule: error.rule };
  }
  if (error instanceof NetworkError) return { status: "error", message: error.message };
  throw error;
}

/**
 * RF-W02.6 — aceitar/recusar contraoferta.
 *
 * RF-W02.7: se outro entregador aceitou pelo valor original enquanto esta tela estava aberta, a
 * contraoferta virou `invalidada` e o backend responde 409. Isso é o fluxo A2 acontecendo, não um
 * defeito — a tela explica e recarrega o estado.
 */
export async function decideCounterofferAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const counterofferId = String(form.get("counterofferId") ?? "");
  const orderId = String(form.get("orderId") ?? "");
  const outcome = form.get("outcome") === "accepted" ? "accepted" : "rejected";

  try {
    await orders.decideCounteroffer(counterofferId, outcome);
  } catch (error) {
    return handle(
      error,
      "Esta proposta não está mais valendo — o pedido foi resolvido por outro caminho enquanto você decidia.",
    );
  }

  revalidatePath(`/merchant/pedidos/${orderId}`);
  return { status: "ok", message: outcome === "accepted" ? "Contraoferta aceita." : "Contraoferta recusada." };
}

/**
 * RF-W03.4 — registra o repasse do código e, opcionalmente, corrige o telefone do recebedor.
 * É essa marca que o job de expiração usa para NÃO atribuir a falha ao estabelecimento (RN-09.3).
 */
export async function dispatchCodeAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const orderId = String(form.get("orderId") ?? "");
  const rawPhone = String(form.get("receiverPhone") ?? "").trim();

  try {
    await delivery.dispatch(orderId, rawPhone || null);
  } catch (error) {
    return handle(error, "O estado da entrega mudou. Recarregue para ver a situação atual.");
  }

  revalidatePath(`/merchant/pedidos/${orderId}`);
  return {
    status: "ok",
    message: rawPhone
      ? "Repasse registrado e SMS enviado ao novo telefone."
      : "Repasse registrado. O entregador foi destravado.",
  };
}

/**
 * RF-26.7 — confirma que o pacote foi entregue ao entregador. 422 (`COURIER_NOT_AT_PICKUP`) e 409
 * (o entregador desistiu, ou o pedido já saiu deste estado) vêm com a mensagem do servidor.
 */
export async function confirmPickupAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const orderId = String(form.get("orderId") ?? "");

  try {
    await orders.confirmPickup(orderId);
  } catch (error) {
    return handle(error, "Este pedido não está mais aguardando coleta. Recarregue para ver o estado atual.");
  }

  revalidatePath(`/merchant/pedidos/${orderId}`);
  return { status: "ok", message: "Coleta confirmada. A entrega está a caminho." };
}

/**
 * RF-26.14/RF-26.17 — cancela até a coleta. A taxa, quando o entregador já chegou, é decidida pelo
 * servidor dentro do lock; a resposta diz quanto foi lançado.
 */
export async function cancelOrderAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const orderId = String(form.get("orderId") ?? "");
  const reason = String(form.get("reason") ?? "");
  const note = String(form.get("note") ?? "").trim();

  if (!reason) {
    return { status: "error", message: "Escolha o motivo do cancelamento." };
  }
  if (reason === "other" && !note) {
    return { status: "error", message: "Descreva o motivo quando escolher “outro”." };
  }

  let fee: string | null = null;
  try {
    const resposta = await orders.cancel(orderId, { reason, note: note || null });
    fee = resposta.cancellationFee ?? null;
  } catch (error) {
    return handle(
      error,
      "Este pedido não pode mais ser cancelado — o entregador já coletou o pacote. Recarregue para ver o estado atual.",
    );
  }

  revalidatePath(`/merchant/pedidos/${orderId}`);
  revalidatePath("/merchant/pedidos");
  return {
    status: "ok",
    message: fee
      ? `Pedido cancelado. Taxa de R$ ${fee} a pagar ao entregador, que já havia chegado.`
      : "Pedido cancelado.",
  };
}

/**
 * RF-W03.7 — contestação de entrega `finalizado_contestavel` em v1 é sempre um chamado de suporte,
 * já com a referência do pedido preenchida (T-21). Sem essa referência, o time de suporte reabriria
 * o contexto do zero a cada chamado.
 */
export async function openOrderTicketAction(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const orderId = String(form.get("orderId") ?? "");
  const orderNumber = String(form.get("orderNumber") ?? "");

  try {
    await tickets.create({
      subject: `Contestação da entrega do pedido nº ${orderNumber}`,
      message:
        "Entrega finalizada em modo contestável (sem código validado). Solicito revisão do caso.",
      reference: { type: "order", id: orderId },
    });
  } catch (error) {
    return handle(error, "O estado do pedido mudou. Recarregue para ver a situação atual.");
  }

  return { status: "ok", message: "Chamado aberto — o suporte vai analisar e responder por lá." };
}
