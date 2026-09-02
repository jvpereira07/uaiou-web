"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * RF-W02.8 — sem WebSocket, "ver o aceite chegar sem recarregar manualmente" vira duas rotas mais
 * baratas: revalidar quando a aba volta a ter foco (o caso comum — quem saiu e voltou) e um
 * intervalo curto de fundo para quem deixa a aba aberta e olhando. `router.refresh()` reexecuta os
 * Server Components da rota sem perder o estado local dos client components.
 */
export function PollOnFocus({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    function onFocus() {
      router.refresh();
    }
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => router.refresh(), intervalMs);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [router, intervalMs]);

  return null;
}
