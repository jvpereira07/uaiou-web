"use client";

import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

/**
 * Firebase no navegador — só Cloud Messaging. As chaves são identificadores públicos de cliente
 * (ficam no bundle de qualquer forma); o que protege o projeto é a conta de serviço, que só o
 * backend tem. Por isso é `NEXT_PUBLIC_`, ao contrário da URL da API (RF-W01.9).
 */
const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

/** Service worker próprio: trata `push` sem importar o SDK de um CDN (ver o arquivo). */
export const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

/** Chave em localStorage do `id` devolvido por `POST /me/devices`, para a baixa no logout. */
export const DEVICE_ID_KEY = "uaiou_push_device_id";

/** Sem config completa, VAPID, HTTPS ou suporte do navegador: `null`, e a tela segue sem push. */
export async function messagingIfAvailable(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !config.apiKey || !config.appId || !VAPID_KEY) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (!(await isSupported().catch(() => false))) return null;
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return getMessaging(app);
}
