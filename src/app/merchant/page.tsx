import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata = { title: "Início" };

export default function MerchantHomePage() {
  return (
    <div>
      <PageHeader
        title="Início"
        description="Seu painel de pedidos e entregas."
        breadcrumbs={["UaiOu", "Estabelecimento", "Início"]}
        action={
          <Link className="btn" href="/merchant/pedidos/novo">
            <Icon.Plus size={15} /> Novo pedido
          </Link>
        }
      />
      <Card title="Bem-vindo">
        <p>
          Acompanhe seus pedidos, negocie contraofertas e repasse o código de entrega para o
          entregador na porta do cliente.
        </p>
        <div className="row" style={{ marginTop: "var(--space-3)" }}>
          <Link className="btn" href="/merchant/pedidos">
            Ver pedidos
          </Link>
          <Link className="btn secondary" href="/merchant/pedidos/novo">
            Novo pedido
          </Link>
        </div>
      </Card>
    </div>
  );
}
