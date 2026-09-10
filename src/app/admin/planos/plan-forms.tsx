"use client";

import { useActionState } from "react";
import { EntitySelect, type EntityOption } from "@/components/entity-select";
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

export function AssignPlanForm({
  plans,
  merchants,
}: {
  plans: EntityOption[];
  merchants: EntityOption[];
}) {
  const [state, formAction, pending] = useActionState(assignPlanAction, IDLE);
  return (
    <form action={formAction}>
      {state.status === "ok" ? <Alert tone="success"><p>{state.message}</p></Alert> : null}
      {state.status === "error" ? <p className="small">{state.message}</p> : null}
      <Field label="Estabelecimento" name="merchantId">
        <EntitySelect
          name="merchantId"
          options={merchants}
          required
          placeholder="Selecione o estabelecimento…"
          emptyMessage="Nenhum estabelecimento cadastrado."
        />
      </Field>
      <Field label="Plano" name="planId">
        <EntitySelect
          name="planId"
          options={plans}
          required
          placeholder="Selecione o plano…"
          emptyMessage="Nenhum plano cadastrado."
        />
      </Field>
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Atribuindo…" : "Atribuir plano"}
        </button>
      </div>
    </form>
  );
}

export function CreditAdjustmentForm({
  merchants,
  tickets,
}: {
  merchants: EntityOption[];
  tickets: EntityOption[];
}) {
  const [state, formAction, pending] = useActionState(creditAdjustmentAction, IDLE);
  return (
    <form action={formAction}>
      {state.status === "ok" ? <Alert tone="success"><p>{state.message}</p></Alert> : null}
      {state.status === "error" ? <p className="small">{state.message}</p> : null}
      <Field label="Estabelecimento" name="targetUserId">
        <EntitySelect
          name="targetUserId"
          options={merchants}
          required
          placeholder="Selecione o estabelecimento…"
          emptyMessage="Nenhum estabelecimento cadastrado."
        />
      </Field>
      <Field label="Quantidade (negativo para debitar)" name="amount">
        <input id="amount" name="amount" type="number" required />
      </Field>
      <Field label="Motivo" name="reason">
        <input id="reason" name="reason" required />
      </Field>
      <Field
        label="Chamado de referência (obrigatório)"
        name="ticketId"
        hint="Todo ajuste de créditos precisa nascer de um chamado (RN-13.2)."
      >
        <EntitySelect
          name="ticketId"
          options={tickets}
          required
          placeholder="Selecione o chamado…"
          emptyMessage="Nenhum chamado aberto para referenciar."
        />
      </Field>
      <div className="form-actions">
        <button className="btn small" type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Aplicar ajuste"}
        </button>
      </div>
    </form>
  );
}
