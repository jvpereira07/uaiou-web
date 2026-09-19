"use client";

import { useActionState, useState } from "react";
import { Alert, Field } from "@/components/ui";
import type { AdminOrderAction } from "@/lib/api/types";
import { ACTION_LABELS } from "../labels";
import { orderActionAction, type OrderActionState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: OrderActionState = { status: "idle" };

/**
 * As opções vêm de `availableActions` do backend — a tela não reimplementa a máquina de estados.
 * Ações destrutivas (cancelar, devolver) pedem uma segunda confirmação com o efeito descrito.
 */
export function OrderActionForm({
  orderId,
  actions,
}: {
  orderId: string;
  actions: AdminOrderAction[];
}) {
  const [state, formAction, pending] = useActionState(orderActionAction, IDLE);
  const [action, setAction] = useState<AdminOrderAction>(actions[0] ?? "cancel");
  const [confirming, setConfirming] = useState(false);

  const selected = ACTION_LABELS[action];

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (selected.danger && !confirming) {
          event.preventDefault();
          setConfirming(true);
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />

      {state.status === "ok" ? (
        <Alert tone="success">
          <p className="small">{state.message}</p>
        </Alert>
      ) : null}
      {state.status === "error" ? (
        <Alert tone="error">
          <p className="small">{state.message}</p>
        </Alert>
      ) : null}

      <Field label="Ação" name="action" hint={selected.description}>
        <select
          id="action"
          name="action"
          value={action}
          onChange={(event) => {
            setAction(event.target.value as AdminOrderAction);
            setConfirming(false);
          }}
        >
          {actions.map((candidate) => (
            <option key={candidate} value={candidate}>
              {ACTION_LABELS[candidate].label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Motivo (obrigatório, vai para a auditoria)" name="reason">
        <textarea id="reason" name="reason" required rows={2} maxLength={280} />
      </Field>

      {confirming ? (
        <Alert tone="error" title={`Confirmar: ${selected.label.toLowerCase()}`}>
          <p className="small">
            {selected.description} Estabelecimento e entregador serão notificados. Clique em
            confirmar para aplicar.
          </p>
        </Alert>
      ) : null}

      <div className="form-actions">
        <button
          className={`btn small ${selected.danger ? "danger" : ""}`}
          type="submit"
          disabled={pending}
        >
          {pending ? "Aplicando…" : confirming ? "Confirmar" : selected.label}
        </button>
      </div>
    </form>
  );
}
