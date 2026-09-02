import { Alert, Card } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

export const metadata = { title: "Use o aplicativo" };

/**
 * O entregador não tem cliente web (pendência aberta no backlog). Dizer isso é melhor que deixá-lo
 * num painel que nunca teria as telas de que ele precisa — localização contínua, geofence e foto
 * são necessidades nativas de celular.
 */
export default function NoWebPanelPage() {
  return (
    <main className="notice-shell">
      <div className="login-card">
        <Card title="O painel web é para estabelecimentos">
          <Alert tone="info">
            <p>
              Entregadores usam o aplicativo. As telas de disponibilidade, localização e finalização
              de entrega dependem de recursos do celular que o navegador não oferece de forma
              confiável.
            </p>
          </Alert>
          <LogoutButton />
        </Card>
      </div>
    </main>
  );
}
