import { notFound } from "next/navigation";
import { Badge, Card, DefinitionList, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { admin } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatScore } from "@/lib/format";
import { userStatus } from "@/lib/status";
import { LiftSanctionButton } from "./lift-sanction-button";
import { SanctionForm } from "./sanction-form";

/**
 * O nome de quem está sendo moderado no título da aba: um admin costuma abrir vários dossiês em
 * paralelo, e "UaiOu — painel" repetido em cinco abas não ajuda a achar o certo.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await admin.user(id).catch(() => null);
  return { title: user?.displayName ?? "Usuário" };
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await admin.user(id).catch((error) => {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  });
  if (!user) notFound();

  return (
    <div>
      <PageHeader
        title={user.displayName}
        description={
          user.role === "COURIER"
            ? "Entregador"
            : user.role === "MERCHANT"
              ? "Estabelecimento"
              : "Admin"
        }
        breadcrumbs={["UaiOu", "Administração", "Usuários", user.displayName]}
        action={
          <StatusBadge tone={userStatus(user.status).tone}>
            {userStatus(user.status).label}
          </StatusBadge>
        }
      />

      <div className="grid-2">
        <Card title="Dados">
          <DefinitionList
            items={[
              { term: "E-mail", value: user.email },
              { term: "Telefone", value: user.telefone ?? "não informado" },
              { term: "CPF", value: user.profile.cpf ?? "—" },
              { term: "CNPJ", value: user.profile.cnpj ?? "—" },
              { term: "Score", value: user.profile.score ? formatScore(Number(user.profile.score)) : "sem base" },
              {
                term: "Bloqueado por estabelecimentos",
                value: user.blockedByMerchantCount ?? "—",
              },
              { term: "Cadastrado em", value: formatDateTime(user.createdAt) },
            ]}
          />
        </Card>

        <Card title="Documentos">
          {user.documents.documents.length === 0 ? (
            <EmptyState title="Sem documentos enviados" />
          ) : (
            <div className="stack">
              {user.documents.documents.map((doc) => (
                <div key={doc.id} className="spread small">
                  <span>{doc.type}</span>
                  <Badge tone={doc.status === "approved" ? "success" : "neutral"}>{doc.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Sanções">
        {user.sanctions.length === 0 ? (
          <EmptyState title="Nenhuma sanção aplicada" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Início</th>
                  <th scope="col">Fim</th>
                  <th scope="col">Situação</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {user.sanctions.map((sanction) => (
                  <tr key={sanction.id}>
                    <td>{sanction.type === "ban" ? "Banimento" : "Suspensão"}</td>
                    <td className="small">{sanction.reason}</td>
                    <td className="small">{formatDateTime(sanction.start)}</td>
                    <td className="small">{sanction.end ? formatDateTime(sanction.end) : "—"}</td>
                    <td>
                      <Badge tone={sanction.active ? "danger" : "neutral"}>
                        {sanction.active ? "Ativa" : "Encerrada"}
                      </Badge>
                    </td>
                    <td>
                      {sanction.active ? (
                        <LiftSanctionButton userId={user.id} sanctionId={sanction.id} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Aplicar sanção">
        <SanctionForm userId={user.id} />
      </Card>
    </div>
  );
}
