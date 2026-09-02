import { OrderForm } from "./order-form";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Novo pedido" };

export default function NewOrderPage() {
  return (
    <>
      <PageHeader
        title="Novo pedido"
        description="Publicar consome um crédito e o pedido aparece na vitrine dos entregadores próximos."
        breadcrumbs={["UaiOu", "Estabelecimento", "Pedidos", "Novo pedido"]}
      />
      <OrderForm />
    </>
  );
}
