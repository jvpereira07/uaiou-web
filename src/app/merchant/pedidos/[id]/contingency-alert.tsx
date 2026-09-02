"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Field } from "@/components/ui";
import { formatCountdown } from "@/lib/format";
import { dispatchCodeAction, type ActionState } from "./actions";

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: ActionState = { status: "idle" };

/**
 * RF-W03.3/RF-W03.5 — o alerta que impede o entregador de ficar parado na rua.
 *
 * Três decisões que o texto da task exige e que são fáceis de errar:
 *
 * 1. **Persistente, não toast.** Um aviso que some sozinho é exatamente o que faz o prazo vencer
 *    sem ninguém perceber. Fica no topo do pedido até ser resolvido.
 * 2. **Contagem regressiva de verdade**, atualizada a cada segundo — "prazo até 19:10" não
 *    transmite urgência do mesmo jeito que ver o relógio andando.
 * 3. **Consequência escrita por extenso.** RF-W03.5: o estabelecimento precisa saber, ENQUANTO o
 *    relógio corre, que a omissão libera a finalização com foto e desconta reputação. Descobrir
 *    isso depois, na tela de penalidades, é tarde.
 */
export function ContingencyAlert({
  orderId,
  deadlineAt,
  receiverPhone,
}: {
  orderId: string;
  deadlineAt: string;
  receiverPhone: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(dispatchCodeAction, IDLE);
  const [now, setNow] = useState<number>(() => Date.now());
  const [showPhoneField, setShowPhoneField] = useState(!receiverPhone);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Repasse registrado: o alerta se encerra e a tela recarrega para refletir o novo estado.
    if (state.status === "ok") router.refresh();
  }, [state.status, router]);

  const remaining = formatCountdown(deadlineAt, now);
  const expired = remaining === "prazo vencido";

  if (state.status === "ok") {
    return (
      <Alert tone="success" title="Repasse registrado">
        <p>{state.message}</p>
      </Alert>
    );
  }

  return (
    <Alert
      tone={expired ? "error" : "warning"}
      title={
        expired
          ? "O prazo venceu — a entrega pode ser finalizada sem código"
          : "O entregador está esperando o código"
      }
      rule={state.rule}
    >
      {!expired ? (
        <p>
          Tempo restante: <span className="countdown">{remaining}</span>
        </p>
      ) : null}

      <p className="small" style={{ marginTop: "var(--space-2)" }}>
        {expired ? (
          <>
            Como não houve repasse no prazo e o pedido não tinha telefone do recebedor, o entregador
            foi liberado para finalizar com foto e <strong>sua reputação foi descontada</strong>.
            Informar o telefone agora evita que isso se repita nos próximos pedidos.
          </>
        ) : (
          <>
            O código falhou na porta do cliente. Repasse o código agora ou informe o telefone do
            recebedor. <strong>Se o prazo vencer sem resposta</strong>, o entregador poderá
            finalizar a entrega apenas com foto e <strong>sua reputação perde pontos</strong>.
          </>
        )}
      </p>

      {state.status === "error" ? (
        <p className="small" style={{ marginTop: "var(--space-2)" }}>
          {state.message}
        </p>
      ) : null}

      <form action={formAction} style={{ marginTop: "var(--space-3)" }}>
        <input type="hidden" name="orderId" value={orderId} />

        {showPhoneField ? (
          <Field
            label="Telefone do recebedor"
            name="receiverPhone"
            hint="Informar o telefone corrige o pedido e dispara o SMS com o código."
          >
            <input
              id="receiverPhone"
              name="receiverPhone"
              inputMode="tel"
              defaultValue={receiverPhone ?? ""}
              placeholder="31998877665"
            />
          </Field>
        ) : (
          <input type="hidden" name="receiverPhone" value="" />
        )}

        <div className="row">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Registrando…" : "Registrei o repasse do código"}
          </button>
          {!showPhoneField ? (
            <button
              type="button"
              className="btn secondary small"
              onClick={() => setShowPhoneField(true)}
            >
              Informar outro telefone
            </button>
          ) : null}
        </div>
      </form>
    </Alert>
  );
}
