/**
 * Service worker de push do painel web (FCM).
 *
 * Não importa o SDK do Firebase de propósito: `importScripts` de um CDN amarra o worker a uma versão
 * fixa fora do package.json. O FCM entrega um `push` comum com JSON `{ notification, data }` — o
 * mesmo contrato que `FcmPushSender.java` monta —, e mostrar isso não precisa de SDK nenhum.
 *
 * Só chega aqui com a aba fechada ou em segundo plano. Com a aba em foco, o `onMessage` da página
 * mostra o aviso dentro do painel (ver `components/web-push.tsx`).
 */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    return;
  }

  const notification = payload.notification || {};
  const data = payload.data || {};
  const urgent = data.priority === "urgent";

  event.waitUntil(
    self.registration.showNotification(notification.title || "UaiOu", {
      body: notification.body || "",
      icon: "/icon.png",
      tag: data.notificationId || undefined,
      requireInteraction: urgent,
      data,
    }),
  );
});

/** Leva ao pedido quando o evento tem um; senão, ao início do painel. Reaproveita aba aberta. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = data.orderId ? `/merchant/pedidos/${data.orderId}` : "/merchant";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
