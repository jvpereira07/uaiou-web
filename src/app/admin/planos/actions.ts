"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface PlanActionState {
  status: "idle" | "ok" | "error";
  message?: string;
  rule?: string | null;
}

export async function createPlanAction(
  _previous: PlanActionState,
  form: FormData,
): Promise<PlanActionState> {
  const name = String(form.get("name") ?? "").trim();
  const monthlyCredits = Number(form.get("monthlyCredits") ?? "0");
  const price = String(form.get("price") ?? "").trim();

  try {
    await admin.createPlan({ name, monthlyCredits, price });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath("/admin/planos");
  return { status: "ok", message: "Plano criado." };
}

export async function assignPlanAction(
  _previous: PlanActionState,
  form: FormData,
): Promise<PlanActionState> {
  const merchantId = String(form.get("merchantId") ?? "").trim();
  const planId = String(form.get("planId") ?? "").trim();

  try {
    await admin.assignPlan(merchantId, planId);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  return { status: "ok", message: "Plano atribuído ao estabelecimento." };
}

/**
 * RF-W05.7/RN-13.2 — todo ajuste de crédito nasce de um chamado; o campo de referência é obrigatório
 * na interface, não só na API (que devolveria 422 de qualquer forma).
 */
export async function creditAdjustmentAction(
  _previous: PlanActionState,
  form: FormData,
): Promise<PlanActionState> {
  const targetUserId = String(form.get("targetUserId") ?? "").trim();
  const amount = Number(form.get("amount") ?? "0");
  const reason = String(form.get("reason") ?? "").trim();
  const ticketId = String(form.get("ticketId") ?? "").trim();

  try {
    await admin.financialAdjustment({
      type: "credits_adjustment",
      targetUserId,
      amount,
      reason,
      reference: { type: "ticket", id: ticketId },
    });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  return { status: "ok", message: "Ajuste de créditos registrado." };
}
