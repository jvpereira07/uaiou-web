"use client";

import { useTransition } from "react";
import { liftSanctionAction } from "./actions";

export function LiftSanctionButton({ userId, sanctionId }: { userId: string; sanctionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn secondary small"
      disabled={pending}
      onClick={() => startTransition(() => liftSanctionAction(userId, sanctionId))}
    >
      {pending ? "Encerrando…" : "Encerrar antecipadamente"}
    </button>
  );
}
