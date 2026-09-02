"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Alert, Card, Field } from "@/components/ui";
import type { MeResponse } from "@/lib/api/types";
import { updateProfileAction, type UpdateProfileState } from "./actions";

// Leaflet toca `window`/`navigator` na importação — quebra em SSR.
const MapaDestino = dynamic(
  () => import("@/components/mapa-destino").then((m) => m.MapaDestino),
  { ssr: false, loading: () => <p className="small">Carregando mapa…</p> },
);

// `IDLE` não pode vir de "./actions": um arquivo "use server" só pode exportar funções async.
const IDLE: UpdateProfileState = { status: "idle" };

export function ProfileForm({ me }: { me: MeResponse }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, IDLE);
  const address = me.profile?.address;
  const [coordenadas, setCoordenadas] = useState({
    lat: address?.lat ?? "",
    lng: address?.lng ?? "",
  });

  return (
    <form action={formAction} noValidate>
      {state.status === "error" ? (
        <Alert tone="error">
          <p>{state.message}</p>
        </Alert>
      ) : null}
      {state.status === "success" ? (
        <Alert tone="success">
          <p>{state.message}</p>
        </Alert>
      ) : null}

      <Card title="Dados">
        <div className="form-row">
          <Field label="Nome" name="displayName">
            <input id="displayName" name="displayName" defaultValue={me.displayName} />
          </Field>
          <Field label="Telefone" name="telefone" hint="Opcional.">
            <input
              id="telefone"
              name="telefone"
              inputMode="tel"
              defaultValue={me.telefone ?? ""}
            />
          </Field>
        </div>
      </Card>

      <Card title="Endereço">
        <div className="form-row">
          <Field label="Rua" name="rua">
            <input id="rua" name="rua" defaultValue={address?.rua ?? ""} />
          </Field>
          <Field label="Número" name="numero">
            <input id="numero" name="numero" defaultValue={address?.numero ?? ""} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Bairro" name="bairro">
            <input id="bairro" name="bairro" defaultValue={address?.bairro ?? ""} />
          </Field>
          <Field label="Cidade" name="cidade">
            <input id="cidade" name="cidade" defaultValue={address?.cidade ?? ""} />
          </Field>
          <Field label="CEP" name="cep">
            <input id="cep" name="cep" defaultValue={address?.cep ?? ""} />
          </Field>
        </div>

        <Field
          label="Ponto no mapa"
          name="lat"
          hint="Orienta a rota de retirada no app do entregador — não substitui o endereço em texto acima."
        >
          <MapaDestino
            latInicial={address?.lat ?? undefined}
            lngInicial={address?.lng ?? undefined}
            aoMudar={(lat, lng) => setCoordenadas({ lat: String(lat), lng: String(lng) })}
          />
          <input type="hidden" id="lat" name="lat" value={coordenadas.lat} />
          <input type="hidden" name="lng" value={coordenadas.lng} />
        </Field>
      </Card>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
