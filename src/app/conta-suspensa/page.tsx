import { Alert, Card } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

export const metadata = { title: "Conta suspensa" };

/** RF-W01.4 — conta suspensa/banida: tela informativa com caminho para o suporte. */
export default function SuspendedPage() {
  return (
    <main className="notice-shell">
      <div className="login-card">
        <Card title="Sua conta está suspensa">
          <Alert tone="warning">
            <p>
              O acesso ao painel está temporariamente bloqueado. O motivo e o prazo foram enviados
              por notificação.
            </p>
          </Alert>
          <p className="muted small">
            Para contestar ou entender a decisão, fale com o suporte pelo canal de atendimento.
          </p>
          <LogoutButton />
        </Card>
      </div>
    </main>
  );
}
