"use server";

import { revalidatePath } from "next/cache";
import { tickets } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface TicketState {
  status: "idle" | "error";
  message?: string;
  rule?: string | null;
}

export async function replyAction(_previous: TicketState, form: FormData): Promise<TicketState> {
  const ticketId = String(form.get("ticketId") ?? "");
  const message = String(form.get("message") ?? "").trim();

  try {
    await tickets.addMessage(ticketId, message);
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath(`/admin/suporte/${ticketId}`);
  return { status: "idle" };
}

/** RF-21.6 — resolução é sempre a última palavra do chamado; sem reabertura na v1. */
export async function resolveAction(_previous: TicketState, form: FormData): Promise<TicketState> {
  const ticketId = String(form.get("ticketId") ?? "");
  const finalResponse = String(form.get("finalResponse") ?? "").trim();

  try {
    await tickets.resolve(ticketId, { finalResponse });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath(`/admin/suporte/${ticketId}`);
  return { status: "idle" };
}
