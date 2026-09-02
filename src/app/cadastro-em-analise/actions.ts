"use server";

import { revalidatePath } from "next/cache";
import { documents, uploads } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

export interface UploadDocState {
  status: "idle" | "ok" | "error";
  message?: string;
  rule?: string | null;
}

/** Espelha `PurposePolicy` do backend (T-05): imagem, 5 MB. Validar aqui evita subir 5 MB para levar 422. */
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * RF-05.3/RF-06.2 — os quatro passos do envio de documento, todos no servidor:
 *
 * 1. `POST /uploads` reserva o registro e devolve a URL pré-assinada do MinIO;
 * 2. `PUT` dos bytes direto no MinIO;
 * 3. `PUT /uploads/{id}` confirma (sem isso o upload fica órfão e some no job de limpeza);
 * 4. `POST /me/documents` vincula o upload ao tipo de documento do cadastro.
 *
 * O passo 2 poderia sair do navegador — a URL é pré-assinada justamente para isso —, mas passar
 * pelo servidor Next evita depender de CORS no MinIO e mantém a regra do projeto de que só o
 * servidor fala com a infraestrutura (RF-W01.2/RF-W01.3).
 */
export async function uploadDocumentAction(
  _previous: UploadDocState,
  form: FormData,
): Promise<UploadDocState> {
  const type = String(form.get("type") ?? "");
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Escolha um arquivo para enviar." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { status: "error", message: "O documento precisa ser uma imagem JPEG ou PNG." };
  }
  if (file.size > MAX_BYTES) {
    return { status: "error", message: "O arquivo passa de 5 MB. Envie uma imagem menor." };
  }

  try {
    const created = await uploads.create({
      purpose: type,
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
      return {
        status: "error",
        message: "Não foi possível enviar o arquivo para o armazenamento. Tente de novo.",
      };
    }

    await uploads.confirm(created.id);
    await documents.submit(type, created.id);
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", message: error.message, rule: error.rule };
    }
    if (error instanceof NetworkError) return { status: "error", message: error.message };
    throw error;
  }

  revalidatePath("/cadastro-em-analise");
  return { status: "ok", message: "Documento enviado. Ele entra na fila de análise." };
}
