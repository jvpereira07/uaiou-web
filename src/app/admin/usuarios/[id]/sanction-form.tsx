"use client";

import { useActionState, useState } from "react";
import { Alert, Field } from "@/components/ui";
import { createSanctionAction, type SanctionState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: SanctionState = { status: "idle" };

/**
 * RF-W05.3/RF-W05.10 — suspensão exige prazo, banimento não (mesma regra do banco). Banimento pede
 * confirmação explícita com o resumo do efeito antes de enviar: é uma ação de difícil reversão.
 */
export function SanctionForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(createSanctionAction, IDLE);
  const [type, setType] = useState<"suspension" | "ban">("suspension");
  const [confirmingBan, setConfirmingBan] = useState(false);

  if (state.status === "ok") {
    return (
      <Alert tone="success">
        <p>{state.message}</p>
      </Alert>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (type === "ban" && !confirmingBan) {
          event.preventDefault();
          setConfirmingBan(true);
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />

      <Alert tone="warning" title="Entrega em andamento não é interrompida">
        <p className="small">
          Uma sanção não cancela uma entrega que já está em curso — ela vale para as próximas
          ações do usuário na plataforma.
        </p>
      </Alert>

      {state.status === "error" ? (
        <p className="small" style={{ marginTop: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}

      <Field label="Tipo" name="type">
        <select
          id="type"
          name="type"
          value={type}
          onChange={(event) => {
            setType(event.target.value as "suspension" | "ban");
            setConfirmingBan(false);
          }}
        >
          <option value="suspension">Suspensão</option>
          <option value="ban">Banimento</option>
        </select>
      </Field>

      {type === "suspension" ? (
        <Field label="Prazo até" name="expiresAt">
          <input id="expiresAt" name="expiresAt" type="datetime-local" required />
        </Field>
      ) : null}

      <Field label="Motivo (obrigatório)" name="reason">
        <textarea id="reason" name="reason" required rows={2} />
      </Field>

      {confirmingBan ? (
        <Alert tone="error" title="Confirmar banimento permanente">
          <p className="small">
            Este usuário perde acesso à plataforma indefinidamente. A ação fica registrada na
            auditoria. Clique em confirmar para aplicar.
          </p>
        </Alert>
      ) : null}

      <div className="form-actions">
        <button className={`btn ${type === "ban" ? "danger" : ""} small`} type="submit" disabled={pending}>
          {pending
            ? "Aplicando…"
            : type === "ban" && confirmingBan
              ? "Confirmar banimento"
              : type === "ban"
                ? "Banir"
                : "Suspender"}
        </button>
      </div>
    </form>
  );
}
