import Link from "next/link";
import { Alert, Card, EmptyState, PageHeader, Pagination, Badge } from "@/components/ui";
import { orderStatusLabel } from "@/components/order-status-badge";
import { admin } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/format";
import { LIMIT_RULES, TIMEOUT_ACTIONS, TIMEOUT_RULES } from "../pedidos/labels";
import { BehaviorLimitForm, RunTimeoutsForm, TimeoutSettingForm } from "./timeout-forms";

export const metadata = { title: "Timeouts" };

/**
 * Regras de timeout do ciclo de vida. O job roda a cada minuto e só aplica regras LIGADAS; o
 * "Executar agora" roda a mesma rotina imediatamente. Toda alteração vai para a auditoria.
 */
export default async function TimeoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const perPage = Number(params.perPage ?? "20") || 20;

  const [settings, limits, occurrences] = await Promise.all([
    admin.timeouts(),
    admin.limits(),
    admin.timeoutOccurrences({ page, perPage }),
  ]);

  return (
    <div>
      <PageHeader
        title="Timeouts e limites"
        description="Prazos automáticos para pedidos parados e limites de comportamento (ex.: 3 desistências em 24 h bloqueiam por 2 h)."
        breadcrumbs={["UaiOu", "Administração", "Entregas", "Timeouts"]}
        action={<RunTimeoutsForm />}
      />

      <Alert tone="warning" title="Regras ligadas agem sobre pedidos reais">
        <p className="small">
          O job verifica a cada minuto. Antes de ligar uma regra, confira quantos pedidos já
          passaram do prazo — todos eles serão afetados na próxima execução.
        </p>
      </Alert>

      <div className="grid-3">
        {settings.map((setting) => (
          <Card
            key={setting.rule}
            title={TIMEOUT_RULES[setting.rule]?.label ?? setting.rule}
            action={
              <Badge tone={setting.active ? "success" : "neutral"}>
                {setting.active ? "Ligada" : "Desligada"}
              </Badge>
            }
          >
            <p className="small">{TIMEOUT_RULES[setting.rule]?.description}</p>
            <TimeoutSettingForm setting={setting} />
            <p className="small muted">
              Atualizada em {formatDateTime(setting.updatedAt)}
              {setting.updatedBy ? ` por ${setting.updatedBy.name}` : ""}
            </p>
          </Card>
        ))}
      </div>

      <h2>Limites de comportamento</h2>
      <div className="grid-2">
        {limits.map((limit) => (
          <Card
            key={limit.rule}
            title={LIMIT_RULES[limit.rule]?.label ?? limit.rule}
            action={
              <Badge tone={limit.active ? "success" : "neutral"}>
                {limit.active ? "Ligado" : "Desligado"}
              </Badge>
            }
          >
            <p className="small">{LIMIT_RULES[limit.rule]?.description}</p>
            <BehaviorLimitForm limit={limit} />
            <p className="small muted">
              Atualizado em {formatDateTime(limit.updatedAt)}
              {limit.updatedBy ? ` por ${limit.updatedBy.name}` : ""}
            </p>
          </Card>
        ))}
      </div>

      <Card title="Histórico de disparos">
        {occurrences.data.length === 0 ? (
          <EmptyState title="Nenhum timeout disparado ainda" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Regra</th>
                  <th scope="col">Ação</th>
                  <th scope="col">Status anterior</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {occurrences.data.map((o) => (
                  <tr key={o.id}>
                    <td className="mono small">
                      <Link href={`/admin/pedidos/${o.orderId}`}>nº {o.orderNumber ?? "—"}</Link>
                    </td>
                    <td className="small">{TIMEOUT_RULES[o.rule]?.label ?? o.rule}</td>
                    <td className="small">{TIMEOUT_ACTIONS[o.action] ?? o.action}</td>
                    <td className="small">{orderStatusLabel(o.previousStatus)}</td>
                    <td className="small">{formatDateTime(o.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={occurrences.meta.page}
          perPage={occurrences.meta.perPage}
          total={occurrences.meta.total}
          baseHref="/admin/timeouts"
        />
      </Card>
    </div>
  );
}
