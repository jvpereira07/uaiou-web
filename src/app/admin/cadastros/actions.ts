"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface ReviewState {
  status: "idle" | "ok" | "error";
  message?: string;
  rule?: string | null;
}

/** RF-W05.1 — rejeição sem motivo é impedida NA INTERFACE, não só na API: `required` no textarea. */
export async function reviewRegistrationAction(
  _previous: ReviewState,
  form: FormData,
): Promise<ReviewState> {
  const userId = String(form.get("userId") ?? "");
  const decision = form.get("decision") === "approved" ? "approved" : "rejected";
  const reason = String(form.get("reason") ?? "").trim();

  try {
    await admin.reviewRegistration(userId, { decision, reason });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath("/admin/cadastros");
  return {
    status: "ok",
    message: decision === "approved" ? "Cadastro aprovado." : "Cadastro rejeitado.",
  };
}
