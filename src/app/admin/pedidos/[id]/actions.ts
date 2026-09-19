"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { AdminOrderAction } from "@/lib/api/types";

export interface OrderActionState {
  status: "idle" | "ok" | "error";
  message?: string;
}

const ACTIONS: readonly AdminOrderAction[] = [
  "cancel",
  "return_to_showcase",
  "mark_picked_up",
  "finalize",
];

export async function orderActionAction(
  _previous: OrderActionState,
  form: FormData,
): Promise<OrderActionState> {
  const orderId = String(form.get("orderId") ?? "");
  const rawAction = String(form.get("action") ?? "");
  const reason = String(form.get("reason") ?? "").trim();

  const action = ACTIONS.find((candidate) => candidate === rawAction);
  if (!action) return { status: "error", message: "Escolha uma ação." };
  if (!reason) return { status: "error", message: "Informe o motivo — ele vai para a auditoria." };

  try {
    await admin.orderAction(orderId, { action, reason });
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  return { status: "ok", message: "Estado do pedido atualizado." };
}
