"use client";

import { useState } from "react";
import { Alert, Card } from "@/components/ui";
import type { DeliveryCodeResponse } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

/**
 * RF-W03.1/RF-W03.2 — o código, a ação de copiar e o texto pronto para repassar.
 *
 * O aviso de auditoria não é letra miúda: a leitura É registrada (RF-15.11), e esconder isso
 * transformaria uma trilha legítima em vigilância silenciosa. Quem sabe que está sendo registrado
 * não é prejudicado pelo registro.
 */
export function DeliveryCode({
  orderNumber,
  code,
}: {
  orderNumber: string;
  code: DeliveryCodeResponse;
}) {
  const [copied, setCopied] = useState<"code" | "message" | null>(null);

  const message = `Seu código de entrega do pedido nº ${orderNumber} é ${code.code}. Informe ao entregador na porta.`;

  async function copy(value: string, what: "code" | "message") {
    await navigator.clipboard.writeText(value).catch(() => null);
    setCopied(what);
    window.setTimeout(() => setCopied(null), 2000);
  }

  if (code.status === "blocked" || code.code === null) {
    return (
      <Card title="Código de entrega">
        <Alert tone="warning" title="Código bloqueado por excesso de tentativas">
          <p>
            O entregador errou o código vezes demais e ele foi bloqueado. Ele já pode acionar a
            contingência — quando isso acontecer, aparece aqui um alerta com prazo para você
            repassar o código.
          </p>
        </Alert>
      </Card>
    );
  }

  return (
    <Card title="Código de entrega">
      <p className="delivery-code" aria-label={`Código de entrega: ${code.code}`}>
        {code.code}
      </p>

      <div className="row" style={{ marginTop: "var(--space-3)" }}>
        <button type="button" className="btn small" onClick={() => copy(code.code ?? "", "code")}>
          {copied === "code" ? "Copiado!" : "Copiar código"}
        </button>
        <button
          type="button"
          className="btn secondary small"
          onClick={() => copy(message, "message")}
        >
          {copied === "message" ? "Copiado!" : "Copiar mensagem pronta"}
        </button>
      </div>

      <p className="muted small" style={{ marginTop: "var(--space-3)" }}>
        Válido até {formatDateTime(code.expiresAt)}.
      </p>

      <Alert tone="info" title="Esta leitura fica registrada">
        <p className="small">
          Toda vez que este código é aberto, a plataforma registra quem viu e quando — já são{" "}
          {code.audit.readCount} {code.audit.readCount === 1 ? "leitura" : "leituras"}
          {code.audit.lastReadAt ? `, a última em ${formatDateTime(code.audit.lastReadAt)}` : ""}. É
          o que protege você e o entregador em caso de contestação.
        </p>
      </Alert>
    </Card>
  );
}
