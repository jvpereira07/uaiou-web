import Link from "next/link";
import { PageHeader, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";
import { admin, tickets } from "@/lib/api/endpoints";

export const metadata = { title: "Início" };

/**
 * RF-W05.9 — painel operacional mínimo. `T-24` (o painel completo, com entregas em andamento e
 * contingências abertas) ainda não foi construído no backend — não existe rota para essas duas
 * métricas. Em vez de inventar dados, esta tela mostra o que a API já tem: fila de cadastros e
 * chamados abertos. O resto chega quando T-24 existir.
 */
export default async function AdminHomePage() {
  const [registrations, openTickets] = await Promise.all([
    admin.pendingRegistrations({ perPage: 1 }),
    tickets.list({ status: "open" }),
  ]);

  return (
    <div>
      <PageHeader
        title="Início"
        description="As duas filas que dependem de alguém da moderação."
        breadcrumbs={["UaiOu", "Administração", "Início"]}
      />

      {/* `Stat` já é um cartão. Envolvê-lo num `Card` desenhava caixa dentro de caixa, com o rótulo
          repetido no título e no `label` — dois quadros para um número só. */}
      <div className="grid-2">
        <Stat
          label="Cadastros aguardando moderação"
          value={registrations.meta.total}
          icon={<Icon.FileText size={16} />}
          hint={
            <Link className="stat-action" href="/admin/cadastros">
              Ver fila de cadastros →
            </Link>
          }
        />
        <Stat
          label="Chamados de suporte abertos"
          value={openTickets.length}
          icon={<Icon.LifeBuoy size={16} />}
          hint={
            <Link className="stat-action" href="/admin/suporte">
              Ver fila de suporte →
            </Link>
          }
        />
      </div>
    </div>
  );
}
