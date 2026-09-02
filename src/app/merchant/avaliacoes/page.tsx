import { Alert, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";
import { reviews } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/format";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Avaliações" };

/**
 * RF-W04.6 — pendentes primeiro (é a ação que falta), recebidas depois. O aviso do padrão positivo
 * fica junto da lista de pendentes: é exatamente onde alguém decide "deixo pra depois" e precisa
 * saber que isso já é, silenciosamente, uma nota máxima automática.
 */
export default async function ReviewsPage() {
  const [pending, received] = await Promise.all([reviews.pending(), reviews.received()]);

  return (
    <div>
      <PageHeader
        title="Avaliações"
        description="Entregas aguardando sua nota e as que você já avaliou."
        breadcrumbs={["UaiOu", "Estabelecimento", "Avaliações"]}
      />

      <Alert tone="info" title="Quem não avalia, avalia positivo">
        <p className="small">
          Entregas sem avaliação dentro do prazo recebem nota máxima automaticamente. Se algo saiu
          errado, avaliar é a única forma de registrar isso.
        </p>
      </Alert>

      <Card title="Pendentes">
        {pending.length === 0 ? (
          <EmptyState title="Nenhuma avaliação pendente" />
        ) : (
          <div className="stack">
            {pending.map((entry) => (
              <div key={entry.orderId} className="card" style={{ padding: "var(--space-3)" }}>
                <p>
                  Pedido nº {entry.orderNumber ?? entry.orderId} · {entry.counterpartyName ?? "Entregador"}
                </p>
                <p className="muted small">Prazo: {formatDateTime(entry.deadline)}</p>
                <ReviewForm entry={entry} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Os dois números saem do cartão "Recebidas": `Stat` já é cartão, e ali dentro viravam
          caixas dentro de caixa. Como resumo do bloco, funcionam melhor acima dele. */}
      <div className="grid-2">
        <Stat
          label="Nota média"
          value={received.summary.average != null ? received.summary.average.toFixed(2) : "sem base"}
          icon={<Icon.Star size={16} />}
        />
        <Stat
          label="Taxa de avaliações ativas"
          value={
            received.summary.activeRate != null
              ? `${(received.summary.activeRate * 100).toFixed(0)}%`
              : "—"
          }
          icon={<Icon.CheckCircle size={16} />}
          hint="Quanto da nota média vem de avaliação de verdade, não automática"
        />
      </div>

      <Card title="Avaliações recebidas">
        {received.data.length === 0 ? (
          <EmptyState title="Nenhuma avaliação recebida ainda" />
        ) : (
          <div className="table-wrap" style={{ marginTop: "var(--space-3)" }}>
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Nota</th>
                  <th scope="col">Comentário</th>
                  <th scope="col">Origem</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {received.data.map((entry) => (
                  <tr key={entry.id}>
                    <td className="mono">{entry.orderNumber ?? entry.orderId}</td>
                    <td>{entry.rating}</td>
                    <td className="small">{entry.comment ?? "—"}</td>
                    <td className="small">{entry.active ? "Ativa" : "Automática"}</td>
                    <td className="small">{formatDateTime(entry.createdAt)}</td>
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
