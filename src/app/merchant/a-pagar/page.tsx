import { Alert, Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ledger } from "@/lib/api/endpoints";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata = { title: "A pagar" };

/**
 * RF-W04.4/RF-W04.5 — o que o estabelecimento deve a cada entregador, e nada além disso: sem botão
 * de pagar. O acerto acontece fora da plataforma (Pix, dinheiro, o que combinarem) — prometer um
 * pagamento que a API não processa seria o pior defeito possível desta tela.
 */
export default async function PayablesPage() {
  const payables = await ledger.payables();

  return (
    <div>
      <PageHeader
        title="A pagar"
        description="Quanto você deve a cada entregador pelas entregas já concluídas."
        breadcrumbs={["UaiOu", "Estabelecimento", "A pagar"]}
      />

      <Alert tone="info" title="O acerto é fora da plataforma">
        <p className="small">
          Esta tela só mostra quanto você deve a cada entregador pelas entregas já realizadas. O
          pagamento em si — Pix, dinheiro, o que vocês combinarem — acontece fora do uaiou. Não há
          ação de pagar por aqui.
        </p>
      </Alert>

      {/* `Stat` já é um cartão — o `Card` em volta só desenhava uma segunda moldura. */}
      <Stat
        label="Total devido"
        value={formatMoney(payables.total)}
        icon={<Icon.Receipt size={16} />}
      />

      {payables.byCourier.length === 0 ? (
        <Card>
          <EmptyState title="Nada a pagar no momento" />
        </Card>
      ) : (
        // O total vai para o cabeçalho do cartão em vez de um `Stat` dentro dele: o número
        // pertence ao mesmo bloco que o nome do entregador, e uma caixa aninhada só para exibi-lo
        // empurrava a tabela para baixo sem explicar nada.
        payables.byCourier.map((courier) => (
          <Card
            key={courier.courierId}
            title={courier.courierName ?? "Entregador"}
            action={<span className="stat-value">{formatMoney(courier.total)}</span>}
          >
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">Pedido</th>
                    <th scope="col" className="numeric">
                      Valor
                    </th>
                    <th scope="col">Situação</th>
                    <th scope="col">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {courier.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="mono">{entry.orderNumber ?? entry.orderId}</td>
                      <td className="numeric">{formatMoney(entry.amount)}</td>
                      <td>
                        {/* RF-W04.4 — distingue o que o entregador já confirmou como recebido do
                            que ainda está em aberto (T-18). */}
                        {entry.status === "settled" ? (
                          <Badge tone="success">Confirmado pelo entregador</Badge>
                        ) : (
                          <Badge tone="warning">Ainda não confirmado</Badge>
                        )}
                      </td>
                      <td className="small">{formatDateTime(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
