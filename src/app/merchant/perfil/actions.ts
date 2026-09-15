"use server";

import { revalidatePath } from "next/cache";
import { profile, uploads } from "@/lib/api/endpoints";
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

export interface UploadPhotoState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Espelha `PurposePolicy` do backend: imagem, 5 MB. */
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Logo do estabelecimento — mesmos passos do envio de documento (T-05), com o vínculo feito por
 * `PATCH /me` com `photoUploadId`: o perfil aponta para um upload confirmado e do próprio usuário,
 * nunca para uma chave de armazenamento escrita à mão.
 */
export async function uploadProfilePhotoAction(
  _previous: UploadPhotoState,
  form: FormData,
): Promise<UploadPhotoState> {
  const file = form.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Escolha uma imagem para enviar." };
  }
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return { status: "error", message: "A imagem precisa ser JPEG ou PNG." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { status: "error", message: "A imagem passa de 5 MB. Envie uma menor." };
  }

  try {
    const created = await uploads.create({
      purpose: "MERCHANT_LOGO",
      contentType: file.type,
      sizeBytes: file.size,
    });

    const put = await fetch(created.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: await file.arrayBuffer(),
      cache: "no-store",
    });
    if (!put.ok) {
      return { status: "error", message: "Não foi possível enviar a imagem. Tente de novo." };
    }

    await uploads.confirm(created.id);
    await profile.update({ profile: { photoUploadId: created.id } });
  } catch (error) {
    if (error instanceof ApiError) return { status: "error", message: error.message };
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath("/merchant/perfil");
  return { status: "success", message: "Foto atualizada." };
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
