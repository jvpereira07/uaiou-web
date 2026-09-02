import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { admin } from "@/lib/api/endpoints";
import { formatMoney } from "@/lib/format";
import { AssignPlanForm, CreatePlanForm, CreditAdjustmentForm } from "./plan-forms";

export const metadata = { title: "Planos" };

/** RF-W05.7 — catálogo, atribuição a um estabelecimento e ajuste de créditos com referência obrigatória. */
export default async function PlansPage() {
  const plans = await admin.plans({ perPage: 100 });

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
          <AssignPlanForm plans={plans.data.map((p) => ({ id: p.id, name: p.name }))} />
        </Card>

        <Card title="Ajuste de créditos">
          <CreditAdjustmentForm />
        </Card>
      </div>
    </div>
  );
}
