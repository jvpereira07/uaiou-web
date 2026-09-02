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
