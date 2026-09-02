"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Field } from "@/components/ui";
import type { Role } from "@/lib/api/types";

/**
 * RF-W01.3 — o formulário manda a credencial para `/api/session` (rota do próprio Next), nunca para
 * o backend. Quem fala com a API é o servidor; aqui não existe token em variável nenhuma.
 *
 * O toggle de papel não é enfeite (auth.md, item 4): conta de outro tipo responde 422, e o usuário
 * precisa entender que escolheu o lado errado, não que a senha está errada.
 */
export function LoginForm({ googleClientId }: { googleClientId: string | null }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("MERCHANT");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; rule: string | null } | null>(null);
  const [invalid, setInvalid] = useState<"login" | "password" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInvalid(null);

    // O formulário é `noValidate` para controlar a aparência da mensagem em vez de usar o balão
    // nativo — o que significa que a checagem de campo vazio é responsabilidade daqui. Sem ela, o
    // envio vazio ia até o backend e voltava com "obrigatório para este grantType": jargão do
    // protocolo, que não diz à pessoa o que fazer (RF-W01.6).
    if (!login.trim()) {
      setInvalid("login");
      setError({ message: "Informe seu usuário.", rule: null });
      return;
    }
    if (!password) {
      setInvalid("password");
      setError({ message: "Informe sua senha.", rule: null });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantType: "password", login, password, role }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const envelope =
          typeof body === "object" && body !== null && "error" in body
            ? (body as { error: { message?: string; rule?: string | null } }).error
            : null;
        setError({
          message: envelope?.message ?? "Não foi possível entrar. Tente novamente.",
          rule: envelope?.rule ?? null,
        });
        return;
      }

      // O middleware decide o destino a partir do papel e do status — repetir essa regra aqui
      // criaria dois lugares para manter em sincronia.
      router.replace("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error ? (
        <Alert tone="error" rule={error.rule}>
          <p>{error.message}</p>
        </Alert>
      ) : null}

      <div className="role-toggle" role="group" aria-label="Tipo de conta">
        <button type="button" aria-pressed={role === "MERCHANT"} onClick={() => setRole("MERCHANT")}>
          Estabelecimento
        </button>
        <button type="button" aria-pressed={role === "ADMIN"} onClick={() => setRole("ADMIN")}>
          Administração
        </button>
      </div>

      <Field
        label="Usuário"
        name="login"
        error={invalid === "login" ? "Informe seu usuário." : null}
      >
        <input
          id="login"
          name="login"
          autoComplete="username"
          required
          autoFocus
          value={login}
          onChange={(event) => setLogin(event.target.value)}
        />
      </Field>

      <Field
        label="Senha"
        name="password"
        error={invalid === "password" ? "Informe sua senha." : null}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <button className="btn" type="submit" disabled={submitting} style={{ width: "100%" }}>
        {submitting ? "Entrando…" : "Entrar"}
      </button>

      <div className="login-divider">ou</div>

      {googleClientId ? (
        <>
          <button className="btn google" type="button" disabled>
            Entrar com o Google
          </button>
          <p className="small muted" style={{ marginTop: "var(--space-3)" }}>
            Entrar com Google usa o mesmo caminho: o <code>idToken</code> devolvido pelo provedor
            é enviado a <code>/api/session</code> com <code>grantType: &quot;google&quot;</code>.
          </p>
        </>
      ) : (
        <p className="small muted">
          Login com Google indisponível: <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> não está
          configurado neste ambiente.
        </p>
      )}

      {role === "MERCHANT" ? (
        <p className="small muted" style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
          Ainda não tem conta? <Link href="/registrar">Cadastre seu estabelecimento</Link>
        </p>
      ) : null}
    </form>
  );
}
