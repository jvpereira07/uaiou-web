"use client";

import { useActionState } from "react";
import { replyAction, resolveAction, type TicketState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: TicketState = { status: "idle" };

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(replyAction, IDLE);
  return (
    <form action={formAction} style={{ marginTop: "var(--space-3)" }}>
      <input type="hidden" name="ticketId" value={ticketId} />
      {state.status === "error" ? <p className="small">{state.message}</p> : null}
      <textarea name="message" rows={3} required placeholder="Escreva uma mensagem…" />
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}

export function ResolveForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(resolveAction, IDLE);
  return (
    <form action={formAction}>
      <input type="hidden" name="ticketId" value={ticketId} />
      {state.status === "error" ? <p className="small">{state.message}</p> : null}
      <textarea name="finalResponse" rows={3} required placeholder="Resposta final ao usuário…" />
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Encerrando…" : "Encerrar chamado"}
        </button>
      </div>
    </form>
  );
}
