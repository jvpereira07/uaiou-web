"use server";

import { revalidatePath } from "next/cache";
import { profile } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface UpdateProfileState {
  status: "idle" | "success" | "error";
  message?: string;
  field?: string | null;
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfileAction(
  _previous: UpdateProfileState,
  form: FormData,
): Promise<UpdateProfileState> {
  const displayName = text(form, "displayName");
  const telefone = text(form, "telefone");
  const bairro = text(form, "bairro");
  const rua = text(form, "rua");
  const numero = text(form, "numero");
  const cidade = text(form, "cidade");
  const cep = text(form, "cep");
  const lat = text(form, "lat");
  const lng = text(form, "lng");

  try {
    await profile.update({
      displayName: displayName || undefined,
      telefone: telefone || undefined,
      profile: {
        bairro: bairro || undefined,
        rua: rua || undefined,
        numero: numero || undefined,
        cidade: cidade || undefined,
        cep: cep || undefined,
        // Par: só manda os dois juntos — enviar um sem o outro é o
        // `INCOMPLETE_COORDINATES` que o backend rejeita (400).
        lat: lat && lng ? lat : undefined,
        lng: lat && lng ? lng : undefined,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", message: error.message, field: null };
    }
    if (error instanceof NetworkError) {
      return { status: "error", message: error.message };
    }
    throw error;
  }

  revalidatePath("/merchant/perfil");
  return { status: "success", message: "Perfil atualizado." };
}
