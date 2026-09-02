"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui";
import { openOrderTicketAction, type ActionState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: ActionState = { status: "idle" };

/**
 * RF-W03.7 — a única via de contestação em v1: nenhuma ação de disputa existe no contrato (o
 * `/orders/{id}/dispute` de entregas.md não tem controller no backend — aspiracional, não
 * implementado). Isso vira "abrir chamado" já referenciando o pedido, um clique.
 */
export function OpenTicketButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [state, formAction, pending] = useActionState(openOrderTicketAction, IDLE);

  if (state.status === "ok") {
    return (
      <Alert tone="success">
        <p>{state.message}</p>
      </Alert>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="orderNumber" value={orderNumber} />
      {state.status === "error" ? (
        <p className="small" style={{ marginBottom: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}
      <button className="btn secondary small" type="submit" disabled={pending}>
        {pending ? "Abrindo…" : "Contestar esta entrega (abrir chamado)"}
      </button>
    </form>
  );
}
