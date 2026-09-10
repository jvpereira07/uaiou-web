import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { admin, tickets } from "@/lib/api/endpoints";
import { formatDateTime, formatMoney } from "@/lib/format";
import { AssignPlanForm, CreatePlanForm, CreditAdjustmentForm } from "./plan-forms";

export const metadata = { title: "Planos" };

/** RF-W05.7 — catálogo, atribuição a um estabelecimento e ajuste de créditos com referência obrigatória. */
export default async function PlansPage() {
  /**
   * RF-W01.10 — os formulários escolhem entidades pelo nome, então a página carrega as listas
   * junto do catálogo em vez de exigir que o operador cole um UUID.
   */
  const [plans, merchants, openTickets] = await Promise.all([
    admin.plans({ perPage: 100 }),
    admin.merchants({ perPage: 200 }),
    tickets.list(),
  ]);

  const merchantOptions = merchants.data.map((merchant) => ({
    id: merchant.id,
    label: merchant.displayName,
    hint: merchant.businessName ?? merchant.email,
  }));

  /** Ajuste de crédito nasce de chamado em aberto: resolvido não serve de referência (RN-13.2). */
  const ticketOptions = openTickets
    .filter((ticket) => ticket.status !== "resolved")
    .map((ticket) => ({
      id: ticket.id,
      label: ticket.subject,
      hint: ticket.authorName ?? formatDateTime(ticket.createdAt),
    }));

  return (
    <div>
      <PageHeader
        title="Planos e créditos"
        description="Catálogo de planos, atribuição a estabelecimentos e ajustes manuais de saldo."
        breadcrumbs={["UaiOu", "Administração", "Planos"]}
      />

      <div className="grid-2">
        <Card title="Catálogo">
          {plans.data.length === 0 ? (
            <EmptyState title="Nenhum plano cadastrado" />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Créditos/mês</th>
                    <th scope="col" className="numeric">
                      Preço
                    </th>
                    <th scope="col">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.data.map((plan) => (
                    <tr key={plan.id}>
                      <td>{plan.name}</td>
                      <td>{plan.monthlyCredits}</td>
                      <td className="numeric">{formatMoney(plan.price)}</td>
                      <td>
                        <Badge tone={plan.active ? "success" : "neutral"}>
                          {plan.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Novo plano">
          <CreatePlanForm />
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Atribuir plano a um estabelecimento">
          <AssignPlanForm
            plans={plans.data
              .filter((plan) => plan.active)
              .map((plan) => ({ id: plan.id, label: plan.name, hint: formatMoney(plan.price) }))}
            merchants={merchantOptions}
          />
        </Card>

        <Card title="Ajuste de créditos">
          <CreditAdjustmentForm merchants={merchantOptions} tickets={ticketOptions} />
        </Card>
      </div>
    </div>
  );
}
