"use server";

import { revalidatePath } from "next/cache";
import { reviews } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface ReviewActionState {
  status: "idle" | "ok" | "error";
  message?: string;
  rule?: string | null;
}

export async function createReviewAction(
  _previous: ReviewActionState,
  form: FormData,
): Promise<ReviewActionState> {
  const orderId = String(form.get("orderId") ?? "");
  const rating = Number(form.get("rating") ?? "0");
  const comment = String(form.get("comment") ?? "").trim();

  try {
    await reviews.create(orderId, rating, comment || null);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath("/merchant/avaliacoes");
  return { status: "ok", message: "Avaliação enviada." };
}
