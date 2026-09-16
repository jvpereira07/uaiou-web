"use server";

import { devices } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export type PushRegistrationResult = { status: "ok"; deviceId: string } | { status: "error" };

/**
 * Registro do navegador para push. Server Action e não o proxy: o proxy só aceita leitura (ver
 * `api/proxy`), e toda escrita tem ponto de entrada tipado no servidor.
 */
export async function registerPushDeviceAction(token: string): Promise<PushRegistrationResult> {
  if (token.length === 0 || token.length > 255) return { status: "error" };
  try {
    const device = await devices.register(token);
    return { status: "ok", deviceId: device.id };
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) return { status: "error" };
    throw error;
  }
}

/** Baixa no logout — sem ela, o próximo usuário deste navegador recebe push do anterior. */
export async function removePushDeviceAction(deviceId: string): Promise<void> {
  try {
    await devices.remove(deviceId);
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) return;
    throw error;
  }
}
