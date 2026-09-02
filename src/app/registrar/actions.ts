"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api/server";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { RegisterRequest, RegisterResponse } from "@/lib/api/types";

export interface RegisterState {
  status: "idle" | "error";
  message?: string;
  rule?: string | null;
  field?: "login" | "email" | "cnpj" | "password" | "displayName" | "businessName" | null;
  /**
   * RF-W01.6-adjacente: React reseta os campos não controlados do `<form>` depois de QUALQUER
   * execução da Server Action que não lance exceção — inclusive quando ela devolve um erro de
   * negócio. Sem devolver os valores digitados de volta, um erro de CNPJ duplicado apagaria a
   * senha, o e-mail, tudo — obrigando a redigitar o formulário inteiro por causa de um campo.
   * Senha nunca entra aqui: reexibir senha digitada é o tipo de "ajuda" que vira vazamento.
   */
  values?: { displayName: string; businessName: string; cnpj: string; login: string; email: string };
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * RF-04.1/T-03 — cadastro público de estabelecimento. Nasce `pending` e sem token (auth.md, item 3):
 * não há sessão para abrir aqui, só o encaminhamento para `/login`, de onde o middleware manda o
 * usuário recém-criado para `/cadastro-em-analise`.
 */
export async function registerAction(
  _previous: RegisterState,
  form: FormData,
): Promise<RegisterState> {
  const login = text(form, "login");
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const displayName = text(form, "displayName");
  const businessName = text(form, "businessName");
  const cnpj = text(form, "cnpj").replace(/\D/g, "");
  const values = { displayName, businessName, cnpj, login, email };

  if (password !== confirmPassword) {
    return { status: "error", message: "As senhas não coincidem.", values };
  }

  const body: RegisterRequest = {
    role: "MERCHANT",
    login,
    email,
    password,
    displayName,
    profile: { cnpj, businessName },
  };

  try {
    await api.post<RegisterResponse>("/auth/registrations", body, { anonymous: true });
  } catch (error) {
    if (error instanceof ApiError) {
      // 409 traduz a UNIQUE violada no banco (login/email/cnpj) — o código já diz qual campo.
      let field: RegisterState["field"] =
        error.code === "LOGIN_ALREADY_TAKEN"
          ? "login"
          : error.code === "EMAIL_ALREADY_TAKEN"
            ? "email"
            : error.code === "CNPJ_ALREADY_TAKEN"
              ? "cnpj"
              : null;

      // 400 VALIDATION_ERROR traz um `details` por campo (bean validation) — sem ler isso, "um ou
      // mais campos são inválidos" não diz QUAL, o mesmo defeito que RF-W01.6 existe para evitar.
      let message = error.message;
      if (!field && error.details) {
        const known: RegisterState["field"][] = [
          "login",
          "email",
          "password",
          "displayName",
          "businessName",
          "cnpj",
        ];
        const hit = known.find((key) => key && key in (error.details as Record<string, unknown>));
        if (hit) {
          field = hit;
          message = String((error.details as Record<string, unknown>)[hit]);
        }
      }

      return { status: "error", message, rule: error.rule, field, values };
    }
    if (error instanceof NetworkError) return { status: "error", message: error.message, values };
    throw error;
  }

  // Sem sessão para abrir (o backend não emite token aqui — auth.md, item 3): manda para /login
  // já com o aviso de sucesso.
  redirect("/login?registrado=1");
}
