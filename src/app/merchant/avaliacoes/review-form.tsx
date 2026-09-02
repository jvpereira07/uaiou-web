"use client";

import { useActionState } from "react";
import { Alert, Field } from "@/components/ui";
import type { PendingReviewEntry } from "@/lib/api/types";
import { createReviewAction, type ReviewActionState } from "./actions";

const RATINGS = [1, 2, 3, 4, 5];

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: ReviewActionState = { status: "idle" };

export function ReviewForm({ entry }: { entry: PendingReviewEntry }) {
  const [state, formAction, pending] = useActionState(createReviewAction, IDLE);

  if (state.status === "ok") {
    return (
      <Alert tone="success">
        <p>{state.message}</p>
      </Alert>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={entry.orderId} />
      {state.status === "error" ? (
        <p className="small" style={{ marginBottom: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}

      <Field label="Nota" name={`rating-${entry.orderId}`}>
        <div className="row">
          {RATINGS.map((value) => (
            <label key={value} className="small">
              <input type="radio" name="rating" value={value} required /> {value}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Comentário (opcional)" name={`comment-${entry.orderId}`}>
        <textarea name="comment" rows={2} />
      </Field>

      <button className="btn small" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
