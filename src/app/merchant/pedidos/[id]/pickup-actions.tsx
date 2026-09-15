"use client";

import { useActionState, useState } from "react";
import { Alert, Card, Field } from "@/components/ui";
import type { Money } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { cancelOrderAction, confirmPickupAction, type ActionState } from "./actions";

const IDLE: ActionState = { status: "idle" };

/** RF-26.16 — lista fechada; o backend recusa qualquer outro código. */
const REASONS: { value: string; label: string }[] = [
  { value: "customer_gave_up", label: "Cliente desistiu" },
  { value: "payment_declined", label: "Pagamento recusado" },
  { value: "out_of_stock", label: "Produto em falta" },
  { value: "order_error", label: "Erro no pedido" },
  { value: "courier_delay", label: "Entregador atrasado" },
  { value: "other", label: "Outro" },
];

/**
 * RF-26.7 — confirmação da coleta pela loja. O botão só é renderizado quando o servidor ofereceu
 * `pickupConfirmation` em `_links`: é ele quem sabe se o entregador está mesmo na porta.
 */
export function ConfirmPickup({
  orderId,
  courierName,
  vehiclePlate,
  photoUrl,
  arrived,
}: {
  orderId: string;
  courierName?: string | null;
  vehiclePlate?: string | null;
  photoUrl?: string | null;
  arrived: boolean;
}) {
  const [state, formAction, pending] = useActionState(confirmPickupAction, IDLE);
  const quem = courierName ?? "O entregador";

  return (
    <Card title={arrived ? `${quem} chegou` : "Coleta do pedido"}>
      {state.status === "error" ? (
        <Alert tone={state.staleState ? "warning" : "error"} rule={state.rule}>
          <p>{state.message}</p>
        </Alert>
      ) : null}
      {state.status === "ok" ? (
        <Alert tone="success">
          <p>{state.message}</p>
        </Alert>
      ) : null}

      <div className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL pré-assinada do MinIO, de host variável
          <img
            src={photoUrl}
            alt={`Foto de ${quem}`}
            width={56}
            height={56}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : null}
        <div>
          <p>
            <strong>{quem}</strong>
            {vehiclePlate ? ` — placa ${vehiclePlate}` : null}
          </p>
          <p className="small muted">Entregue o pacote ao entregador e confirme a coleta.</p>
        </div>
      </div>

      <form action={formAction} style={{ marginTop: "var(--space-3)" }}>
        <input type="hidden" name="orderId" value={orderId} />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Confirmando…" : "Confirmar coleta"}
        </button>
      </form>
    </Card>
  );
}

/**
 * RF-26.14 — cancelamento com motivo. RF-26.17: quando o entregador já chegou, a taxa aparece
 * ANTES da confirmação, com o valor que o servidor calculou.
 */
export function CancelOrder({
  orderId,
  orderNumber,
  pendingFee,
}: {
  orderId: string;
  orderNumber: string;
  pendingFee?: Money | null;
}) {
  const [state, formAction, pending] = useActionState(cancelOrderAction, IDLE);
  const [reason, setReason] = useState("");

  if (state.status === "ok") {
    return (
      <Alert tone="success" title={`Pedido nº ${orderNumber} cancelado`}>
        <p>{state.message}</p>
      </Alert>
    );
  }

  return (
    <Card title="Cancelar pedido">
      {state.status === "error" ? (
        <Alert tone={state.staleState ? "warning" : "error"} rule={state.rule}>
          <p>{state.message}</p>
        </Alert>
      ) : null}

      {pendingFee ? (
        <Alert tone="warning" title="O entregador já chegou">
          <p>
            Cancelar agora gera taxa de <strong>{formatMoney(pendingFee)}</strong> (50% do frete) a
            pagar a ele, porque ele já se deslocou até aqui.
          </p>
        </Alert>
      ) : (
        <p className="small muted">
          Depois que o entregador coletar o pacote, o cancelamento deixa de ser possível — o caso
          passa a ser de suporte.
        </p>
      )}

      <form action={formAction}>
        <input type="hidden" name="orderId" value={orderId} />

        <Field label="Motivo" name="reason">
          <select
            id="reason"
            name="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          >
            <option value="">Selecione…</option>
            {REASONS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </Field>

        {reason === "other" ? (
          <Field label="Descreva o motivo" name="note">
            <textarea id="note" name="note" rows={2} maxLength={280} required />
          </Field>
        ) : (
          <input type="hidden" name="note" value="" />
        )}

        <button className="btn danger" type="submit" disabled={pending || !reason}>
          {pending ? "Cancelando…" : "Cancelar pedido"}
        </button>
      </form>
    </Card>
  );
}
