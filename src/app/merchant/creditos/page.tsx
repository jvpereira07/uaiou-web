import { Alert, Card, EmptyState, PageHeader, Pagination, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";
import { credits } from "@/lib/api/endpoints";
import type { CreditTransactionType } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata = { title: "Créditos" };

/**
 * Rótulos de `CreditTransactionType`.
 *
 * As chaves aqui estavam em português (`cota_mensal`, `consumo_postagem`) — que são os valores da
 * COLUNA no banco, escritos pelo `CreditTransactionTypeConverter`. O JSON usa outro vocabulário: o
 * `@JsonValue` do enum devolve `name().toLowerCase()`, ou seja `monthly_quota`. Nenhuma chave
 * casava, e o extrato mostrava o identificador cru para o lojista.
 */
const TYPE_LABELS: Record<CreditTransactionType, string> = {
  monthly_quota: "Cota mensal",
  posting_consumption: "Consumo (publicação de pedido)",
  adjustment: "Ajuste administrativo",
};

/**
 * RF-W04.1/RF-W04.2/RF-W04.3 — saldo, cota e extrato, sem nenhuma ação de compra ou troca de plano:
 * na v1 quem atribui plano é o admin (comercial, fora do produto). O caminho daqui é sempre "falar
 * com o suporte", nunca um botão de checkout que a API não tem.
 */
export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const perPage = Number(params.perPage ?? "20") || 20;

  const [mine, transactions] = await Promise.all([
    credits.mine(),
    credits.transactions({ page, perPage }),
  ]);

  const subscription = mine.subscription;
  const quotaRatio =
    subscription && subscription.monthlyCredits > 0
      ? subscription.consumedThisCycle / subscription.monthlyCredits
      : null;
  // RF-W04.3 — avisar ANTES de esgotar: 80% do ciclo consumido já é sinal de alerta.
  const approachingQuota = quotaRatio !== null && quotaRatio >= 0.8;

  return (
    <div>
      <PageHeader
        title="Créditos"
        description="Saldo, plano vigente e histórico de consumo."
        breadcrumbs={["UaiOu", "Estabelecimento", "Créditos"]}
      />

      {/* `Stat` JÁ É um cartão. Envolvê-lo num `Card` desenhava caixa dentro de caixa, com o
          título do cartão ("Saldo") dizendo quase a mesma coisa que o rótulo do número
          ("Créditos disponíveis") — dois quadros e dois textos para uma informação só. */}
      <div className="grid-2">
        <Stat
          label="Créditos disponíveis"
          value={mine.creditsBalance}
          icon={<Icon.CreditCard size={16} />}
        />

        {subscription ? (
          <Stat
            label={`Cota do ciclo · ${subscription.planName}`}
            value={`${subscription.consumedThisCycle} / ${subscription.monthlyCredits}`}
            icon={<Icon.Receipt size={16} />}
            hint={`Renova em ${formatDate(subscription.renewsAt)}`}
          />
        ) : (
          <Card title="Plano">
            <p className="muted">
              Nenhum plano atribuído ainda. Fale com o suporte para contratar um.
            </p>
          </Card>
        )}
      </div>

      {approachingQuota ? (
        <Alert tone="warning" title="Cota do ciclo perto do fim">
          <p>
            Você já usou a maior parte da cota mensal. Sem crédito, novos pedidos não podem ser
            publicados — fale com o suporte para aumentar a cota antes que isso aconteça.
          </p>
        </Alert>
      ) : null}

      <Card title="Extrato">
        {transactions.data.length === 0 ? (
          <EmptyState title="Nenhuma movimentação ainda" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col" className="numeric">
                    Quantidade
                  </th>
                  <th scope="col">Pedido</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.map((entry) => (
                  <tr key={entry.id}>
                    <td>{TYPE_LABELS[entry.type] ?? entry.type}</td>
                    {/* `success` não existia como classe solta — só `.badge.success` e
                        `.alert.success` — então o crédito nunca ficou verde. */}
                    <td className="numeric">
                      <span className={entry.quantity < 0 ? "negative" : "positive"}>
                        {entry.quantity > 0 ? "+" : ""}
                        {entry.quantity}
                      </span>
                    </td>
                    <td className="mono small">{entry.orderId ?? "—"}</td>
                    <td className="small">{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={transactions.meta.page}
          perPage={transactions.meta.perPage}
          total={transactions.meta.total}
          baseHref="/merchant/creditos"
        />
      </Card>
    </div>
  );
}
