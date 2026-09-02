import Link from "next/link";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { admin } from "@/lib/api/endpoints";
import { formatScore } from "@/lib/format";
import { userStatus } from "@/lib/status";
import type { UserStatus } from "@/lib/api/types";

export const metadata = { title: "Usuários" };

/**
 * RF-W05.2 — supervisão de entregadores e estabelecimentos.
 *
 * A listagem NÃO depende de busca: `search` é opcional em `GET /admin/couriers|/merchants`, e um
 * painel de supervisão que só mostra algo depois que o admin adivinha um nome é inútil para o caso
 * mais comum — "quem existe no sistema?". O termo filtra; a ausência dele lista tudo.
 */
export default async function UsersSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const role = params.role === "merchant" ? "merchant" : "courier";
  const filter = search ? { search } : {};

  const [couriers, merchants] = await Promise.all([
    role === "courier" ? admin.couriers(filter) : Promise.resolve(null),
    role === "merchant" ? admin.merchants(filter) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Entregadores e estabelecimentos cadastrados na plataforma."
        breadcrumbs={["UaiOu", "Administração", "Usuários"]}
      />

      <Card>
        {/* Sem `<input type="hidden" name="role">`: os rádios já mandam `role`, e o hidden vinha
            antes deles na query — `?role=courier&role=merchant` — então o filtro nunca trocava. */}
        <form className="form-row">
          <input name="q" defaultValue={search} placeholder="Nome, e-mail, CPF ou CNPJ" />
          <label className="choice small">
            <input type="radio" name="role" value="courier" defaultChecked={role === "courier"} />
            Entregadores
          </label>
          <label className="choice small">
            <input type="radio" name="role" value="merchant" defaultChecked={role === "merchant"} />
            Estabelecimentos
          </label>
          <button className="btn" type="submit">
            <Icon.Search size={15} /> Buscar
          </button>
        </form>
      </Card>

      <Card>
        {role === "courier" && couriers ? (
          couriers.data.length === 0 ? (
            <EmptyState
              title={search ? "Nenhum entregador encontrado" : "Nenhum entregador cadastrado"}
            />
          ) : (
            <UserTable
              rows={couriers.data.map((c) => ({
                id: c.id,
                name: c.displayName,
                email: c.email,
                status: c.status,
                score: c.score,
              }))}
            />
          )
        ) : merchants ? (
          merchants.data.length === 0 ? (
            <EmptyState
              title={
                search ? "Nenhum estabelecimento encontrado" : "Nenhum estabelecimento cadastrado"
              }
            />
          ) : (
            <UserTable
              rows={merchants.data.map((m) => ({
                id: m.id,
                name: m.displayName,
                email: m.email,
                status: m.status,
                score: m.score,
              }))}
            />
          )
        ) : null}
      </Card>
    </div>
  );
}

function UserTable({
  rows,
}: {
  rows: { id: string; name: string; email: string; status: UserStatus; score?: string | null }[];
}) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">E-mail</th>
            <th scope="col">Situação</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Link href={`/admin/usuarios/${row.id}`}>{row.name}</Link>
              </td>
              <td className="small">{row.email}</td>
              <td className="small">
                <StatusBadge tone={userStatus(row.status).tone}>
                  {userStatus(row.status).label}
                </StatusBadge>
              </td>
              <td className="small">{row.score ? formatScore(Number(row.score)) : "sem base"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
