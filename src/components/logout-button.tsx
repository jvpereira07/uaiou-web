"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { removePushDeviceAction } from "@/app/merchant/push-actions";
import { DEVICE_ID_KEY } from "@/lib/push/firebase-client";

async function removePushDevice(): Promise<void> {
  let deviceId: string | null = null;
  try {
    deviceId = localStorage.getItem(DEVICE_ID_KEY);
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch {
    return;
  }
  if (deviceId) await removePushDeviceAction(deviceId).catch(() => undefined);
}

/** Sair — apaga os cookies pela rota do Next, que também revoga o refresh no backend. */
export function LogoutButton({ className = "btn secondary small" }: { className?: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    // Baixa do push ANTES de apagar a sessão: depois disso o backend não aceita mais o DELETE.
    await removePushDevice();
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
