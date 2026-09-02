import { Alert } from "@/components/ui";
import { LoginForm } from "./login-form";
import { Brand } from "@/components/brand";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registrado?: string }>;
}) {
  const params = await searchParams;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null;

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <Brand size="hero" />
        </div>
        {params.registrado ? (
          <Alert tone="success" title="Cadastro enviado">
            <p>
              Agora é só entrar com o usuário e senha que você acabou de criar. Seu acesso libera
              assim que a análise dos documentos terminar.
            </p>
          </Alert>
        ) : null}
        <LoginForm googleClientId={googleClientId} />
      </div>
    </main>
  );
}
