"use client";

import { useActionState } from "react";
import { Alert, Card, Field } from "@/components/ui";
import { uploadProfilePhotoAction, type UploadPhotoState } from "./actions";

const IDLE: UploadPhotoState = { status: "idle" };

/**
 * Foto do estabelecimento — formulário próprio, fora do de dados: são dois envios diferentes (um
 * multipart, um JSON) e formulário dentro de formulário não existe em HTML.
 *
 * A URL vence em uma hora; recarregar a página renova.
 */
export function PhotoForm({ photoUrl }: { photoUrl?: string | null }) {
  const [state, formAction, pending] = useActionState(uploadProfilePhotoAction, IDLE);

  return (
    <Card title="Foto do estabelecimento">
      {state.status === "error" ? (
        <Alert tone="error">
          <p>{state.message}</p>
        </Alert>
      ) : null}
      {state.status === "success" ? (
        <Alert tone="success">
          <p>{state.message}</p>
        </Alert>
      ) : null}

      <div className="row" style={{ gap: "var(--space-4)", alignItems: "center" }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL pré-assinada do MinIO, de host variável
          <img
            src={photoUrl}
            alt="Foto atual do estabelecimento"
            width={84}
            height={84}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <p className="small muted">Nenhuma foto enviada ainda.</p>
        )}

        <form action={formAction}>
          <Field
            label="Nova foto"
            name="photo"
            hint="JPEG ou PNG, até 5 MB. Ela identifica seu estabelecimento para o entregador."
          >
            <input id="photo" name="photo" type="file" accept="image/jpeg,image/png" required />
          </Field>
          <button className="btn secondary" type="submit" disabled={pending}>
            {pending ? "Enviando…" : "Enviar foto"}
          </button>
        </form>
      </div>
    </Card>
  );
}
