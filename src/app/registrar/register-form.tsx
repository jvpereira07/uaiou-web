"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert, Field } from "@/components/ui";
import { registerAction, type RegisterState } from "./actions";

const IDLE: RegisterState = { status: "idle" };

/**
 * RF-04.1 — cadastro de estabelecimento. Só o papel MERCHANT: o entregador não tem painel web
 * (RF-W01.4, `/sem-painel-web`) e admin nunca se autocadastra (auth.md, item 5 — "criado por
 * processo interno").
 */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, IDLE);

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <Alert tone="error" rule={state.rule}>
          <p>{state.message}</p>
        </Alert>
      ) : null}

      <Field
        label="Nome do responsável"
        name="displayName"
        error={state.field === "displayName" ? state.message : null}
      >
        <input
          id="displayName"
          name="displayName"
          required
          autoComplete="name"
          defaultValue={state.values?.displayName}
        />
      </Field>

      <Field
        label="Nome do estabelecimento"
        name="businessName"
        error={state.field === "businessName" ? state.message : null}
      >
        <input
          id="businessName"
          name="businessName"
          required
          defaultValue={state.values?.businessName}
        />
      </Field>

      <Field
        label="CNPJ"
        name="cnpj"
        error={state.field === "cnpj" ? state.message : null}
      >
        <input
          id="cnpj"
          name="cnpj"
          required
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
          defaultValue={state.values?.cnpj}
        />
      </Field>

      <Field label="Usuário" name="login" error={state.field === "login" ? state.message : null}>
        <input
          id="login"
          name="login"
          required
          autoComplete="username"
          minLength={3}
          maxLength={60}
          defaultValue={state.values?.login}
        />
      </Field>

      <Field label="E-mail" name="email" error={state.field === "email" ? state.message : null}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.values?.email}
        />
      </Field>

      <Field
        label="Senha"
        name="password"
        error={state.field === "password" ? state.message : null}
      >
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>

      <Field label="Confirme a senha" name="confirmPassword">
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </Field>

      <button className="btn" type="submit" disabled={pending} style={{ width: "100%" }}>
        {/* "Entrar" prometia a coisa errada: este botão cria a conta, e o acesso ainda depende da
            análise dos documentos. O rótulo diz o que o clique faz. */}
        {pending ? "Enviando…" : "Criar conta"}
      </button>

      <p className="small muted" style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </form>
  );
}
