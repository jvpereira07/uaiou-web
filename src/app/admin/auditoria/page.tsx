import { Card, EmptyState, PageHeader, Pagination } from "@/components/ui";
import { admin } from "@/lib/api/endpoints";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata = { title: "Auditoria" };

/** RF-W05.8 — somente leitura: nenhuma ação de edição em nenhum lugar desta tela. */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string; perPage?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const perPage = Number(params.perPage ?? "30") || 30;
  const action = params.action ?? "";

  const logs = await admin.auditLogs({ action: action || undefined, page, perPage });

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Toda decisão de moderação fica registrada aqui, com autor e motivo."
        breadcrumbs={["UaiOu", "Administração", "Auditoria"]}
      />

      <Card>
        <form className="form-row">
          <input name="action" defaultValue={action} placeholder="Filtrar por ação (ex.: sanction_applied)" />
          <button className="btn" type="submit">
            Filtrar
          </button>
        </form>
      </Card>

      <Card>
        {logs.data.length === 0 ? (
          <EmptyState title="Nenhum registro neste filtro" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Ação</th>
                  <th scope="col">Admin</th>
                  <th scope="col">Referência</th>
                  <th scope="col">Motivo</th>
                  <th scope="col" className="numeric">
                    Valor
                  </th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {logs.data.map((entry) => (
                  <tr key={entry.id}>
                    <td className="mono small">{entry.action}</td>
                    <td className="small">{entry.admin?.name ?? "—"}</td>
                    <td className="small">
                      {entry.reference ? `${entry.reference.type}:${entry.reference.id}` : "—"}
                    </td>
                    <td className="small">{entry.reason ?? "—"}</td>
                    <td className="numeric small">{entry.amount ? formatMoney(entry.amount) : "—"}</td>
                    <td className="small">{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={logs.meta.page}
          perPage={logs.meta.perPage}
          total={logs.meta.total}
          baseHref={action ? `/admin/auditoria?action=${action}` : "/admin/auditoria"}
        />
      </Card>
    </div>
  );
}
