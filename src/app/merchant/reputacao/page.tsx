import { Alert, Card, DefinitionList, EmptyState, PageHeader, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";
import { score, stats } from "@/lib/api/endpoints";
import { formatDateTime, formatRate, formatScore } from "@/lib/format";

export const metadata = { title: "Reputação" };

/**
 * RF-W04.7/RF-W04.8 — a taxa de contingência aparece ANTES da lista de penalidades, com orientação
 * prática. É a métrica-âncora (RN-09.3/09.4): quem só vê a penalidade depois de aplicada não sabe o
 * que fazer diferente da próxima vez.
 */
export default async function ReputationPage() {
  const [scoreData, statsData] = await Promise.all([score.mine(), stats.merchant("cycle")]);

  return (
    <div>
      <PageHeader
        title="Reputação"
        description="Seu score e o que o move para cima ou para baixo."
        breadcrumbs={["UaiOu", "Estabelecimento", "Reputação"]}
      />

      {/* Os dois números lado a lado, cada um no seu `Stat` — que já é o cartão. O `Card` que
          envolvia cada um criava moldura dentro de moldura e empilhava verticalmente duas
          métricas que se leem melhor juntas. */}
      <div className="grid-2">
        <Stat
          label="Score"
          value={formatScore(scoreData.value)}
          icon={<Icon.Shield size={16} />}
          // `window` chega como `all_time` (MyScoreService). É identificador, não texto de tela.
          hint={scoreData.window === "all_time" ? "Considera todo o histórico" : scoreData.window}
        />
        <Stat
          label="Entregas que precisaram do degrau 2 (repasse manual)"
          value={formatRate(statsData.codeContingencyRate)}
          icon={<Icon.Alert size={16} />}
        />
      </div>

      <Alert tone="info" title="Como reduzir a taxa de contingência">
        <p>
          Informe sempre o telefone do recebedor ao criar o pedido — é o que evita o degrau 2
          acontecer. Se ele acontecer mesmo assim, responda ao alerta de contingência dentro do
          prazo: repassar o código a tempo evita a penalidade, mesmo com o degrau acionado.
        </p>
      </Alert>

      <Card title="Componentes do score">
        {scoreData.components.length === 0 ? (
          <EmptyState title="Sem componentes calculados ainda" />
        ) : (
          <DefinitionList
            items={scoreData.components.map((component) => ({
              term: `${component.name} (peso ${formatRate(component.weight)})`,
              value: component.value !== null && component.value !== undefined
                ? formatScore(component.value)
                : "sem base",
            }))}
          />
        )}
      </Card>

      <Card title="Penalidades">
        {!scoreData.penalties || scoreData.penalties.length === 0 ? (
          <EmptyState title="Nenhuma penalidade registrada" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Motivo</th>
                  <th scope="col">Pedido</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {scoreData.penalties.map((penalty, index) => (
                  <tr key={`${penalty.pedidoId}-${index}`}>
                    <td>{penalty.motivo}</td>
                    <td className="mono small">{penalty.pedidoId}</td>
                    <td className="small">{formatDateTime(penalty.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
