"use client";

import { useActionState } from "react";
import { replyTicketAction, type ReplyState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: ReplyState = { status: "idle" };

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(replyTicketAction, IDLE);

  return (
    <form action={formAction} style={{ marginTop: "var(--space-3)" }}>
      <input type="hidden" name="ticketId" value={ticketId} />
      {state.status === "error" ? (
        <p className="small" style={{ marginBottom: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}
      <textarea name="message" rows={3} required placeholder="Escreva uma mensagem…" />
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}
