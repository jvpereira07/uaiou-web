"use server";

import { revalidatePath } from "next/cache";
import { admin } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { SanctionType } from "@/lib/api/types";

export interface SanctionState {
  status: "idle" | "ok" | "error";
  message?: string;
  rule?: string | null;
}

export async function createSanctionAction(
  _previous: SanctionState,
  form: FormData,
): Promise<SanctionState> {
  const userId = String(form.get("userId") ?? "");
  const type = form.get("type") === "ban" ? "ban" : ("suspension" as SanctionType);
  const reason = String(form.get("reason") ?? "").trim();
  const expiresAt = String(form.get("expiresAt") ?? "").trim();

  try {
    await admin.sanction(userId, {
      type,
      reason,
      expiresAt: type === "suspension" ? new Date(expiresAt).toISOString() : null,
    });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message, rule: error.rule };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath(`/admin/usuarios/${userId}`);
  return { status: "ok", message: "Sanção aplicada." };
}

export async function liftSanctionAction(userId: string, sanctionId: string): Promise<void> {
  await admin.liftSanction(sanctionId);
  revalidatePath(`/admin/usuarios/${userId}`);
}
