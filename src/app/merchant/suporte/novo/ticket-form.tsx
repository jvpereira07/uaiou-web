"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui";
import { createTicketAction, type NewTicketState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: NewTicketState = { status: "idle" };

export function TicketForm() {
  const [state, formAction, pending] = useActionState(createTicketAction, IDLE);

  return (
    <form action={formAction}>
      {state.status === "error" ? (
        <p className="small" style={{ marginBottom: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}

      <Field label="Assunto" name="subject">
        <input id="subject" name="subject" required maxLength={120} />
      </Field>

      <Field label="Mensagem" name="message">
        <textarea id="message" name="message" rows={5} required />
      </Field>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Abrindo…" : "Abrir chamado"}
        </button>
      </div>
    </form>
  );
}
