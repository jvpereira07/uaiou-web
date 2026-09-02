"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Badge, Card, EmptyState } from "@/components/ui";
import type { CounterofferResponse } from "@/lib/api/types";
import { formatDateTime, formatMoney, formatScore, subtractMoney } from "@/lib/format";
import { decideCounterofferAction, type ActionState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: ActionState = { status: "idle" };

/**
 * RF-W02.6 — a decisão precisa dos três dados juntos: valor, score de quem propôs e a diferença em
 * relação ao que foi ofertado. Separar isso em telas obrigaria o estabelecimento a decorar números.
 */
export function Counteroffers({
  orderId,
  counteroffers,
  proposedFee,
  decidable,
}: {
  orderId: string;
  counteroffers: CounterofferResponse[];
  proposedFee: string;
  /** RF-W01.5 — só há decisão enquanto o pedido admite; senão a lista é histórico. */
  decidable: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(decideCounterofferAction, IDLE);

  if (state.staleState) {
    // RF-W02.7 — em vez de erro cru, explica o que aconteceu e oferece o recarregamento.
    return (
      <Card title="Contraofertas">
        <Alert tone="warning" title="Esta proposta não vale mais" rule={state.rule}>
          <p>{state.message}</p>
          <button
            type="button"
            className="btn small"
            style={{ marginTop: "var(--space-2)" }}
            onClick={() => router.refresh()}
          >
            Ver situação atual
          </button>
        </Alert>
      </Card>
    );
  }

  return (
    <Card title="Contraofertas">
      {state.status === "ok" ? (
        <Alert tone="success">
          <p>{state.message}</p>
        </Alert>
      ) : null}
      {state.status === "error" ? (
        <Alert tone="error" rule={state.rule}>
          <p>{state.message}</p>
        </Alert>
      ) : null}

      {counteroffers.length === 0 ? (
        <EmptyState title="Nenhuma contraoferta">
          <p className="small">
            Entregadores próximos podem propor outro valor enquanto o pedido está publicado.
          </p>
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Entregador</th>
                <th scope="col">Score</th>
                <th scope="col" className="numeric">
                  Proposta
                </th>
                <th scope="col" className="numeric">
                  Diferença
                </th>
                <th scope="col">Situação</th>
                <th scope="col">
                  <span className="muted">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {counteroffers.map((offer) => {
                const difference = subtractMoney(offer.proposedFee, proposedFee);
                const moreExpensive = !difference.startsWith("-") && difference !== "0.00";
                return (
                  <tr key={offer.id}>
                    <td>{offer.courierName ?? "—"}</td>
                    <td>
                      {/* RF-20.9 — score nulo é "sem base", nunca zero: entregador novo não é
                          entregador ruim, e a interface não pode sugerir que é. */}
                      <span className={offer.courierScore ? "" : "muted small"}>
                        {formatScore(offer.courierScore)}
                      </span>
                    </td>
                    <td className="numeric">{formatMoney(offer.proposedFee)}</td>
                    <td className="numeric">
                      <span className={moreExpensive ? "" : "muted"}>
                        {moreExpensive ? "+" : ""}
                        {formatMoney(difference)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={offer.status} />
                      <div className="muted small">{formatDateTime(offer.createdAt)}</div>
                    </td>
                    <td>
                      {decidable && offer.status === "pending" ? (
                        <div className="row">
                          <form action={formAction}>
                            <input type="hidden" name="counterofferId" value={offer.id} />
                            <input type="hidden" name="orderId" value={orderId} />
                            <input type="hidden" name="outcome" value="accepted" />
                            <button className="btn small" type="submit" disabled={pending}>
                              Aceitar
                            </button>
                          </form>
                          <form action={formAction}>
                            <input type="hidden" name="counterofferId" value={offer.id} />
                            <input type="hidden" name="orderId" value={orderId} />
                            <input type="hidden" name="outcome" value="rejected" />
                            <button className="btn secondary small" type="submit" disabled={pending}>
                              Recusar
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="muted small">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: CounterofferResponse["status"] }) {
  if (status === "pending") return <Badge tone="warning">Aguardando você</Badge>;
  if (status === "accepted") return <Badge tone="success">Aceita</Badge>;
  if (status === "rejected") return <Badge>Recusada</Badge>;
  // "Invalidada" merece explicação: o entregador não fez nada errado, o pedido foi resolvido antes.
  return <Badge tone="info">Perdeu o objeto</Badge>;
}
