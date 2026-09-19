"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import type { TimeoutSetting } from "@/lib/api/types";
import { TIMEOUT_ACTIONS } from "../pedidos/labels";
import { runTimeoutsAction, updateTimeoutAction, type TimeoutFormState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: TimeoutFormState = { status: "idle" };

export function TimeoutSettingForm({ setting }: { setting: TimeoutSetting }) {
  const [state, formAction, pending] = useActionState(updateTimeoutAction, IDLE);
  const id = `minutes-${setting.rule}`;

  return (
    <form action={formAction}>
      <input type="hidden" name="rule" value={setting.rule} />

      {state.status !== "idle" ? (
        <Alert tone={state.status === "ok" ? "success" : "error"}>
          <p className="small">{state.message}</p>
        </Alert>
      ) : null}

      <p className="small muted">Ação: {TIMEOUT_ACTIONS[setting.action] ?? setting.action}</p>

      <Field
        label="Prazo (minutos)"
        name={id}
        hint={`${setting.overdueNow} pedido(s) já passaram deste prazo agora.`}
      >
        <input
          id={id}
          name="minutes"
          type="number"
          min={1}
          max={43200}
          step={1}
          required
          defaultValue={setting.minutes}
        />
      </Field>

      <label className="choice small">
        <input type="checkbox" name="active" defaultChecked={setting.active} /> Regra ligada
      </label>

      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export function RunTimeoutsForm() {
  const [state, formAction, pending] = useActionState(runTimeoutsAction, IDLE);

  return (
    <form action={formAction} className="row">
      <button className="btn secondary small" type="submit" disabled={pending}>
        {pending ? "Executando…" : "Executar agora"}
      </button>
      {state.status !== "idle" ? <span className="small">{state.message}</span> : null}
    </form>
  );
}
