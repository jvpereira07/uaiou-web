"use server";

import { revalidatePath } from "next/cache";
import { tickets } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface ReplyState {
  status: "idle" | "error";
  message?: string;
  rule?: string | null;
}

export async function replyTicketAction(_previous: ReplyState, form: FormData): Promise<ReplyState> {
  const ticketId = String(form.get("ticketId") ?? "");
  const message = String(form.get("message") ?? "").trim();

  try {
    await tickets.addMessage(ticketId, message);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath(`/merchant/suporte/${ticketId}`);
  return { status: "idle" };
}
