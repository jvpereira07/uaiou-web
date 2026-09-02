"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import {
  assignPlanAction,
  createPlanAction,
  creditAdjustmentAction,
  type PlanActionState,
} from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: PlanActionState = { status: "idle" };

export function CreatePlanForm() {
  const [state, formAction, pending] = useActionState(createPlanAction, IDLE);
  return (
    <form action={formAction}>
      {state.status === "ok" ? <Alert tone="success"><p>{state.message}</p></Alert> : null}
      {state.status === "error" ? <p className="small">{state.message}</p> : null}
      <Field label="Nome" name="name">
        <input id="name" name="name" required />
      </Field>
      <Field label="Créditos mensais" name="monthlyCredits">
        <input id="monthlyCredits" name="monthlyCredits" type="number" min={1} required />
      </Field>
      <Field label="Preço" name="price">
        <input id="price" name="price" placeholder="0.00" required />
      </Field>
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar plano"}
        </button>
      </div>
    </form>
  );
}

export function AssignPlanForm({ plans }: { plans: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(assignPlanAction, IDLE);
  return (
    <form action={formAction}>
      {state.status === "ok" ? <Alert tone="success"><p>{state.message}</p></Alert> : null}
      {state.status === "error" ? <p className="small">{state.message}</p> : null}
      <Field label="ID do estabelecimento" name="merchantId">
        <input id="merchantId" name="merchantId" required />
      </Field>
      <Field label="Plano" name="planId">
        <select id="planId" name="planId" required>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Atribuindo…" : "Atribuir plano"}
        </button>
      </div>
    </form>
  );
}

export function CreditAdjustmentForm() {
  const [state, formAction, pending] = useActionState(creditAdjustmentAction, IDLE);
  return (
    <form action={formAction}>
      {state.status === "ok" ? <Alert tone="success"><p>{state.message}</p></Alert> : null}
      {state.status === "error" ? <p className="small">{state.message}</p> : null}
      <Field label="ID do estabelecimento" name="targetUserId">
        <input id="targetUserId" name="targetUserId" required />
      </Field>
      <Field label="Quantidade (negativo para debitar)" name="amount">
        <input id="amount" name="amount" type="number" required />
      </Field>
      <Field label="Motivo" name="reason">
        <input id="reason" name="reason" required />
      </Field>
      <Field
        label="ID do chamado de referência (obrigatório)"
        name="ticketId"
        hint="Todo ajuste de créditos precisa nascer de um chamado (RN-13.2)."
      >
        <input id="ticketId" name="ticketId" required />
      </Field>
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Aplicar ajuste"}
        </button>
      </div>
    </form>
  );
}
