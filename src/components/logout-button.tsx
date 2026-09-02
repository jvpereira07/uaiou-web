"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Sair — apaga os cookies pela rota do Next, que também revoga o refresh no backend. */
export function LogoutButton({ className = "btn secondary small" }: { className?: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    await fetch("/api/session", { method: "DELETE" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={logout} disabled={leaving}>
      {leaving ? "Saindo…" : "Sair"}
    </button>
  );
}
