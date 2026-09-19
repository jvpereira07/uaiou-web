"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import type { BehaviorLimit, TimeoutSetting } from "@/lib/api/types";
import { TIMEOUT_ACTIONS } from "../pedidos/labels";
import {
  runTimeoutsAction,
  updateLimitAction,
  updateTimeoutAction,
  type TimeoutFormState,
} from "./actions";

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

export function BehaviorLimitForm({ limit }: { limit: BehaviorLimit }) {
  const [state, formAction, pending] = useActionState(updateLimitAction, IDLE);
  const id = (field: string) => `${field}-${limit.rule}`;

  return (
    <form action={formAction}>
      <input type="hidden" name="rule" value={limit.rule} />

      {state.status !== "idle" ? (
        <Alert tone={state.status === "ok" ? "success" : "error"}>
          <p className="small">{state.message}</p>
        </Alert>
      ) : null}

      <Field label="Quantidade máxima" name={id("max")}>
        <input
          id={id("max")}
          name="max"
          type="number"
          min={1}
          max={1000}
          required
          defaultValue={limit.max}
        />
      </Field>
      <Field label="Dentro de (minutos)" name={id("window")} hint="1440 = 24 horas">
        <input
          id={id("window")}
          name="windowMinutes"
          type="number"
          min={1}
          max={43200}
          required
          defaultValue={limit.windowMinutes}
        />
      </Field>
      <Field label="Bloqueio (minutos)" name={id("block")}>
        <input
          id={id("block")}
          name="blockMinutes"
          type="number"
          min={1}
          max={43200}
          required
          defaultValue={limit.blockMinutes}
        />
      </Field>

      <label className="choice small">
        <input type="checkbox" name="active" defaultChecked={limit.active} /> Limite ligado
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
