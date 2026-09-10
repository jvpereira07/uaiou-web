"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Alert, Card, Field } from "@/components/ui";
import { createOrderAction, type CreateOrderState } from "./actions";

// Leaflet toca `window`/`navigator` na importação — quebra em SSR.
const MapaDestino = dynamic(
  () => import("@/components/mapa-destino").then((m) => m.MapaDestino),
  { ssr: false, loading: () => <p className="small">Carregando mapa…</p> },
);

const INITIAL: CreateOrderState = { status: "idle" };

export function OrderForm() {
  const [state, formAction, pending] = useActionState(createOrderAction, INITIAL);
  const values = state.values ?? {};
  const [coordenadas, setCoordenadas] = useState({
    lat: values.lat ?? "",
    lng: values.lng ?? "",
  });

  // Rua, bairro e cidade deixam de ser `defaultValue`: o mapa preenche
  // os três a partir do CEP do ponto marcado, e input não controlado
  // ignora valor escrito de fora.
  const [endereco, setEndereco] = useState({
    street: values.street ?? "",
    district: values.district ?? "",
    city: values.city ?? "",
  });

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <Alert tone="error" rule={state.rule}>
          <p>{state.message}</p>
          {/* RF-W02.3 / critério 2 — sem crédito não é "erro", é um caminho a seguir. E W-04
              proíbe botão de compra: na v1 quem atribui plano é o admin. */}
          {state.showCreditsPath ? (
            <p className="small" style={{ marginTop: "var(--space-2)" }}>
              <Link href="/merchant/creditos">Ver saldo e cota do ciclo</Link> ou{" "}
              <Link href="/merchant/suporte/novo">falar com o suporte</Link> para aumentar a cota.
            </p>
          ) : null}
        </Alert>
      ) : null}

      <Card title="Frete e prazo">
        <div className="form-row">
          <Field
            label="Valor do frete (R$)"
            name="proposedFee"
            error={state.field === "proposedFee" ? state.message : null}
            hint="É o valor que o entregador vê na vitrine."
          >
            <input
              id="proposedFee"
              name="proposedFee"
              inputMode="decimal"
              required
              defaultValue={values.proposedFee ?? ""}
              placeholder="6.00"
            />
          </Field>

          <Field label="Hora prevista de entrega" name="expectedDeliveryAt" hint="Opcional.">
            <input
              id="expectedDeliveryAt"
              name="expectedDeliveryAt"
              type="datetime-local"
              defaultValue={values.expectedDeliveryAt ?? ""}
            />
          </Field>
        </div>
      </Card>

      <Card title="Destino">
        {state.field === "destination" ? (
          <Alert tone="error">
            <p>Não conseguimos localizar este endereço. Revise rua, número e bairro.</p>
          </Alert>
        ) : null}
        <div className="form-row">
          <Field label="Rua" name="street">
            <input
              id="street"
              name="street"
              required
              value={endereco.street}
              onChange={(e) => setEndereco((a) => ({ ...a, street: e.target.value }))}
            />
          </Field>
          <Field label="Número" name="number">
            <input id="number" name="number" required defaultValue={values.number ?? ""} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Complemento" name="complement" hint="Opcional.">
            <input id="complement" name="complement" defaultValue={values.complement ?? ""} />
          </Field>
          <Field label="Bairro" name="district">
            <input
              id="district"
              name="district"
              required
              value={endereco.district}
              onChange={(e) => setEndereco((a) => ({ ...a, district: e.target.value }))}
            />
          </Field>
          <Field label="Cidade" name="city">
            <input
              id="city"
              name="city"
              value={endereco.city}
              onChange={(e) => setEndereco((a) => ({ ...a, city: e.target.value }))}
            />
          </Field>
        </div>
        <Field
          label="Ponto de entrega no mapa"
          name="lat"
          error={state.field === "destination" && !coordenadas.lat ? "Marque o destino no mapa." : null}
          hint="É a coordenada que ancora o geofence da finalização — não o endereço digitado acima."
        >
          <MapaDestino
            latInicial={values.lat}
            lngInicial={values.lng}
            aoMudar={(lat, lng) =>
              setCoordenadas({ lat: String(lat), lng: String(lng) })
            }
            // Marcar outro ponto significa "o destino é outro", então
            // rua/bairro/cidade são sobrescritos — só o número fica,
            // porque CEP nenhum sabe o número da porta.
            aoResolverEndereco={(e) =>
              setEndereco((atual) => ({
                street: e.rua ?? atual.street,
                district: e.bairro ?? atual.district,
                city: e.cidade ?? atual.city,
              }))
            }
          />
          <input type="hidden" id="lat" name="lat" value={coordenadas.lat} />
          <input type="hidden" name="lng" value={coordenadas.lng} />
        </Field>
      </Card>

      <Card title="Quem recebe">
        <div className="form-row">
          <Field label="Nome do recebedor" name="receiverName">
            <input
              id="receiverName"
              name="receiverName"
              required
              defaultValue={values.receiverName ?? ""}
            />
          </Field>
          <Field
            label="Telefone do recebedor"
            name="receiverPhone"
            hint="Tecnicamente opcional — mas leia o aviso abaixo antes de deixar em branco."
          >
            <input
              id="receiverPhone"
              name="receiverPhone"
              inputMode="tel"
              defaultValue={values.receiverPhone ?? ""}
              placeholder="31998877665"
            />
          </Field>
        </div>

        {/* RF-W02.2 — o telefone é opcional na API e caro na prática. Explicar aqui custa uma
            frase; descobrir depois custa uma penalidade de reputação. */}
        <Alert tone="warning" title="Sem telefone, uma falha de código vira problema seu">
          <p className="small">
            O código de entrega é enviado por SMS ao recebedor. Sem telefone, qualquer falha na
            validação cai direto no degrau em que <strong>você</strong> precisa repassar o código
            dentro de um prazo — e não responder desconta pontos da sua reputação.
          </p>
        </Alert>
      </Card>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Publicando…" : "Publicar pedido"}
        </button>
        <Link className="btn secondary" href="/merchant/pedidos">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
