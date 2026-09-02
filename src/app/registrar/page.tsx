import { RegisterForm } from "./register-form";
import { Brand } from "@/components/brand";

export const metadata = { title: "Cadastro" };

export default function RegisterPage() {
  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <Brand size="hero" />
        </div>
        {/* O protótipo escreve "Pronto!" nesta tela, mas ali é a arte de uma etapa concluída. Como
            título de um formulário em branco a palavra mente: nada foi feito ainda. */}
        <h1 style={{ textAlign: "center" }}>Criar conta</h1>
        <p className="muted small" style={{ textAlign: "center", marginTop: 0 }}>
          Depois do cadastro você envia os documentos e a equipe analisa o acesso.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
