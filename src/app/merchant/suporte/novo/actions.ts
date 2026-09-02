"use server";

import { redirect } from "next/navigation";
import { tickets } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface NewTicketState {
  status: "idle" | "error";
  message?: string;
  rule?: string | null;
}

export async function createTicketAction(
  _previous: NewTicketState,
  form: FormData,
): Promise<NewTicketState> {
  const subject = String(form.get("subject") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();

  let created;
  try {
    created = await tickets.create({ subject, message });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  redirect(`/merchant/suporte/${created.id}`);
}
