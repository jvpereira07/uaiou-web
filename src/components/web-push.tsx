"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, onMessage } from "firebase/messaging";
import { Alert } from "@/components/ui";
import {
  DEVICE_ID_KEY,
  SERVICE_WORKER_PATH,
  VAPID_KEY,
  messagingIfAvailable,
} from "@/lib/push/firebase-client";
import { registerPushDeviceAction } from "@/app/merchant/push-actions";

type Incoming = { id: string; title: string; body: string; urgent: boolean; orderId?: string };

/**
 * Push no painel do estabelecimento.
 *
 * - Permissão pedida por CLIQUE, nunca na carga: navegadores rebaixam ou bloqueiam sites que pedem
 *   sem gesto do usuário, e um "bloquear" é praticamente irreversível para leigo.
 * - Já concedida: registra em silêncio a cada carga (o token pode ter girado; backend faz upsert).
 * - Aba em foco: o FCM não mostra nada sozinho, então o aviso aparece aqui e a tela é recarregada
 *   (`router.refresh`) — contraproposta ou contingência entram sem F5.
 */
export function WebPush() {
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [incoming, setIncoming] = useState<Incoming | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void messagingIfAvailable().then(async (messaging) => {
      if (!messaging || cancelled) return;
      setAvailable(true);
      setPermission(Notification.permission);
      if (Notification.permission === "granted") await register();

      unsubscribe = onMessage(messaging, (message) => {
        const data = message.data ?? {};
        setIncoming({
          id: data.notificationId ?? message.messageId ?? String(Date.now()),
          title: message.notification?.title ?? "UaiOu",
          body: message.notification?.body ?? "",
          urgent: data.priority === "urgent",
          orderId: data.orderId,
        });
        router.refresh();
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // `router` é estável; rodar de novo a cada render reinscreveria o listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normal some sozinho; urgente fica até alguém fechar — mesmo critério do `ContingencyAlert`.
  useEffect(() => {
    if (!incoming || incoming.urgent) return;
    const timer = window.setTimeout(() => setIncoming(null), 6000);
    return () => window.clearTimeout(timer);
  }, [incoming]);

  async function enable() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") await register();
  }

  return (
    <>
      {available && permission === "default" ? (
        <Alert tone="info" title="Receba avisos de pedidos mesmo com o painel minimizado">
          <button type="button" className="btn small" onClick={enable}>
            Ativar notificações
          </button>
        </Alert>
      ) : null}

      {incoming ? (
        <div className="push-toast" onClick={() => setIncoming(null)}>
          <Alert tone={incoming.urgent ? "warning" : "info"} title={incoming.title}>
            {incoming.body ? <p>{incoming.body}</p> : null}
            {incoming.orderId ? (
              <a className="btn small secondary" href={`/merchant/pedidos/${incoming.orderId}`}>
                Ver pedido
              </a>
            ) : null}
          </Alert>
        </div>
      ) : null}
    </>
  );
}

async function register(): Promise<void> {
  const messaging = await messagingIfAvailable();
  if (!messaging) return;
  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return;
    const result = await registerPushDeviceAction(token);
    if (result.status === "ok") {
      try {
        localStorage.setItem(DEVICE_ID_KEY, result.deviceId);
      } catch {
        // Sem storage: a baixa no logout não acontece, e o backend remove quando o FCM recusar.
      }
    }
  } catch {
    // Push é complemento: falha aqui não pode quebrar o painel.
  }
}
