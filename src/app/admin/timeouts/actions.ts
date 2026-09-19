"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { TimeoutRule } from "@/lib/api/types";

export interface TimeoutFormState {
  status: "idle" | "ok" | "error";
  message?: string;
}

const RULES: readonly TimeoutRule[] = ["unaccepted", "not_picked_up", "not_delivered"];

export async function updateTimeoutAction(
  _previous: TimeoutFormState,
  form: FormData,
): Promise<TimeoutFormState> {
  const rule = RULES.find((candidate) => candidate === form.get("rule"));
  const minutes = Number(form.get("minutes"));
  const active = form.get("active") === "on";

  if (!rule) return { status: "error", message: "Regra desconhecida." };
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 43200) {
    return { status: "error", message: "O prazo deve ser entre 1 minuto e 30 dias (43200 min)." };
  }

  try {
    await admin.updateTimeout(rule, { minutes, active });
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/timeouts");
  return { status: "ok", message: active ? "Regra salva e ligada." : "Regra salva (desligada)." };
}

/** Sem parâmetros: `useActionState` passa estado e FormData, mas esta ação não usa nenhum. */
export async function runTimeoutsAction(): Promise<TimeoutFormState> {
  try {
    const result = await admin.runTimeouts();
    const total = Object.values(result.affected).reduce((sum, n) => sum + (n ?? 0), 0);
    revalidatePath("/admin/timeouts");
    revalidatePath("/admin/pedidos");
    return {
      status: "ok",
      message:
        Object.keys(result.affected).length === 0
          ? "Nenhuma regra ligada — nada foi executado."
          : `${total} pedido(s) afetado(s).`,
    };
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }
}
