import { Card, PageHeader } from "@/components/ui";
import { TicketForm } from "./ticket-form";

export const metadata = { title: "Novo chamado" };

export default function NewTicketPage() {
  return (
    <div>
      <PageHeader
        title="Novo chamado"
        description="Descreva o que aconteceu. Se for sobre um pedido, informe o número."
        breadcrumbs={["UaiOu", "Estabelecimento", "Suporte", "Novo chamado"]}
      />
      <Card>
        <TicketForm />
      </Card>
    </div>
  );
}
