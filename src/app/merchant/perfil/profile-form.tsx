"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Alert, Card, Field } from "@/components/ui";
import type { MeResponse } from "@/lib/api/types";
import { apenasDigitos, enderecoPorCep, formatarCep } from "@/lib/geo/endereco-publico";
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

  // Rua, bairro, cidade e CEP deixam de ser `defaultValue`: o mapa
  // preenche os quatro a partir do CEP do ponto marcado, e input não
  // controlado ignora valor escrito de fora.
  const [endereco, setEndereco] = useState({
    rua: address?.rua ?? "",
    bairro: address?.bairro ?? "",
    cidade: address?.cidade ?? "",
    cep: address?.cep ?? "",
  });

  /**
   * Caminho inverso do mapa, no mesmo ViaCEP: quem já sabe o próprio CEP
   * digita e ganha rua, bairro e cidade sem precisar caçar o ponto no
   * mapa. Silencioso de propósito — CEP inválido não vira erro aqui, os
   * campos continuam editáveis à mão.
   */
  async function completarPorCep(valor: string) {
    if (apenasDigitos(valor).length !== 8) return;
    const resolvido = await enderecoPorCep(valor);
    if (!resolvido) return;
    setEndereco((atual) => ({
      rua: resolvido.rua ?? atual.rua,
      bairro: resolvido.bairro ?? atual.bairro,
      cidade: resolvido.cidade ?? atual.cidade,
      cep: formatarCep(resolvido.cep),
    }));
  }

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
            <input
              id="rua"
              name="rua"
              value={endereco.rua}
              onChange={(e) => setEndereco((a) => ({ ...a, rua: e.target.value }))}
            />
          </Field>
          <Field label="Número" name="numero">
            <input id="numero" name="numero" defaultValue={address?.numero ?? ""} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Bairro" name="bairro">
            <input
              id="bairro"
              name="bairro"
              value={endereco.bairro}
              onChange={(e) => setEndereco((a) => ({ ...a, bairro: e.target.value }))}
            />
          </Field>
          <Field label="Cidade" name="cidade">
            <input
              id="cidade"
              name="cidade"
              value={endereco.cidade}
              onChange={(e) => setEndereco((a) => ({ ...a, cidade: e.target.value }))}
            />
          </Field>
          <Field
            label="CEP"
            name="cep"
            hint="Digite para completar rua, bairro e cidade pelo ViaCEP."
          >
            <input
              id="cep"
              name="cep"
              inputMode="numeric"
              value={endereco.cep}
              onChange={(e) => setEndereco((a) => ({ ...a, cep: e.target.value }))}
              onBlur={(e) => void completarPorCep(e.target.value)}
            />
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
            // Marcar outro ponto significa "meu endereço é outro", então
            // rua/bairro/cidade/CEP são sobrescritos — só o número fica,
            // porque CEP nenhum sabe o número da porta.
            aoResolverEndereco={(e) =>
              setEndereco((atual) => ({
                rua: e.rua ?? atual.rua,
                bairro: e.bairro ?? atual.bairro,
                cidade: e.cidade ?? atual.cidade,
                cep: formatarCep(e.cep),
              }))
            }
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
