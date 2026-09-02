import { Card, EmptyState, PageHeader } from "@/components/ui";
import { admin } from "@/lib/api/endpoints";
import { RegistrationCard } from "./registration-card";

export const metadata = { title: "Cadastros" };

export default async function RegistrationsPage() {
  const queue = await admin.pendingRegistrations({ perPage: 50 });

  return (
    <div>
      <PageHeader
        title="Cadastros pendentes"
        description="Contas que já enviaram todos os documentos e aguardam decisão."
        breadcrumbs={["UaiOu", "Administração", "Cadastros"]}
      />

      {queue.data.length === 0 ? (
        <Card>
          <EmptyState title="Nenhum cadastro pendente" />
        </Card>
      ) : (
        <div className="stack">
          {queue.data.map((registration) => (
            <RegistrationCard key={registration.userId} registration={registration} />
          ))}
        </div>
      )}
    </div>
  );
}
