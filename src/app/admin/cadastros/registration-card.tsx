"use client";

import { useActionState, useState } from "react";
import { Alert, Badge, Card, Field } from "@/components/ui";
import type { PendingRegistrationSummary } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { documentLabel } from "@/app/cadastro-em-analise/labels";
import { reviewRegistrationAction, type ReviewState } from "./actions";

const DOC_STATUS: Record<string, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Recusado",
  superseded: "Substituído",
};

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: ReviewState = { status: "idle" };

export function RegistrationCard({ registration }: { registration: PendingRegistrationSummary }) {
  const [state, formAction, pending] = useActionState(reviewRegistrationAction, IDLE);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  if (state.status === "ok") {
    return (
      <Card>
        <Alert tone="success">
          <p>{state.message}</p>
        </Alert>
      </Card>
    );
  }

  return (
    <Card title={`${registration.displayName} · ${registration.role === "COURIER" ? "Entregador" : "Estabelecimento"}`}>
      <p className="muted small">
        {registration.email} · cadastrado {formatDateTime(registration.registeredAt)}
      </p>

      <div className="row" style={{ marginTop: "var(--space-2)", flexWrap: "wrap" }}>
        {registration.documents.map((doc) => (
          <a
            key={doc.documentId}
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn secondary small"
          >
            {documentLabel(doc.type)}{" "}
            <Badge tone={doc.status === "approved" ? "success" : "neutral"}>
              {DOC_STATUS[doc.status] ?? doc.status}
            </Badge>
          </a>
        ))}
      </div>

      {state.status === "error" ? (
        <p className="small" style={{ marginTop: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}

      {/* RF-W05.1 + auditoria: o backend exige `reason` nas DUAS decisões — toda revisão vira um
          registro de auditoria com motivo (RN-13.1). Por isso aprovar também abre o campo, em vez
          de mandar um texto automático que encheria a trilha de justificativa vazia. */}
      <form action={formAction} style={{ marginTop: "var(--space-3)" }}>
        <input type="hidden" name="userId" value={registration.userId} />

        {decision !== null ? (
          <>
            <input type="hidden" name="decision" value={decision} />
            <Field
              label={decision === "approved" ? "Observação da aprovação" : "Motivo da rejeição"}
              name={`reason-${registration.userId}`}
              hint="Fica registrado na trilha de auditoria."
            >
              <textarea id={`reason-${registration.userId}`} name="reason" required rows={2} />
            </Field>
          </>
        ) : null}

        <div className="row">
          {decision === "approved" ? (
            <button type="submit" className="btn small" disabled={pending}>
              Confirmar aprovação
            </button>
          ) : decision === "rejected" ? (
            <button type="submit" className="btn danger small" disabled={pending}>
              Confirmar rejeição
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn small"
                onClick={() => setDecision("approved")}
              >
                Aprovar
              </button>
              <button
                type="button"
                className="btn secondary small"
                onClick={() => setDecision("rejected")}
              >
                Rejeitar
              </button>
            </>
          )}
          {decision !== null ? (
            <button type="button" className="btn secondary small" onClick={() => setDecision(null)}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
