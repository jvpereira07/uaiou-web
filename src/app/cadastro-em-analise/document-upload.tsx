"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import { uploadDocumentAction, type UploadDocState } from "./actions";
import { documentLabel } from "./labels";

const IDLE: UploadDocState = { status: "idle" };

/** RF-06.2 — envio de um documento pendente. O arquivo vai para o servidor Next, que executa os
 *  quatro passos do fluxo de upload (T-05) e vincula o documento ao cadastro. */
export function DocumentUpload({ type }: { type: string }) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, IDLE);

  if (state.status === "ok") {
    return (
      <Alert tone="success">
        <p>{state.message}</p>
      </Alert>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="type" value={type} />

      {state.status === "error" ? (
        <Alert tone="error" rule={state.rule}>
          <p>{state.message}</p>
        </Alert>
      ) : null}

      <Field
        label={documentLabel(type)}
        name={`file-${type}`}
        hint="Foto ou digitalização legível, em JPEG ou PNG, até 5 MB."
      >
        <input id={`file-${type}`} name="file" type="file" accept="image/jpeg,image/png" required />
      </Field>

      <button className="btn small" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar documento"}
      </button>
    </form>
  );
}
