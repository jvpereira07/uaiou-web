"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import {
  enderecoPorCoordenada,
  resumirEndereco,
  type EnderecoPublico,
} from "@/lib/geo/endereco-publico";

/**
 * Ícone padrão do Leaflet aponta para assets que o bundler não resolve
 * fora de um `<img>` estático — sem isto o marcador não aparece.
 */
const iconePadrao = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/** Santa Rita do Sapucaí — mesmo centro padrão do app Flutter, até a primeira escolha. */
const CENTRO_PADRAO: [number, number] = [-22.2526, -45.7033];

function CapturaDeClique({ aoClicar }: { aoClicar: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(evento) {
      aoClicar(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

/**
 * Substitui os campos de latitude/longitude digitados à mão (RF-W02, T-11):
 * o estabelecimento clica no mapa para marcar o destino, e o pino pode ser
 * arrastado para ajuste fino. O backend não geocodifica o endereço — ele
 * espera a coordenada pronta — então o pino É a fonte do `lat`/`lng`
 * enviados no formulário, não um enfeite ao lado dos campos de texto.
 *
 * A cada ponto marcado o componente também dispara o fluxo de APIs
 * públicas `coordenada -> CEP -> endereço` (`lib/geo/endereco-publico`)
 * e entrega o resultado em `aoResolverEndereco`, para o formulário
 * preencher rua/bairro/cidade/CEP sozinho. O preenchimento é
 * **sugestão**: os campos continuam editáveis, porque o CEP acerta a
 * rua e erra o número.
 */
export function MapaDestino({
  latInicial,
  lngInicial,
  aoMudar,
  aoResolverEndereco,
}: {
  latInicial?: string;
  lngInicial?: string;
  aoMudar: (lat: number, lng: number) => void;
  /** Opcional: sem ele, nenhuma consulta externa é feita. */
  aoResolverEndereco?: (endereco: EnderecoPublico) => void;
}) {
  const posicaoInicial = useMemo<[number, number] | null>(() => {
    const lat = Number(latInicial);
    const lng = Number(lngInicial);
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return [lat, lng];
    }
    return null;
  }, [latInicial, lngInicial]);

  const [posicao, setPosicao] = useState<[number, number] | null>(posicaoInicial);
  const [buscando, setBuscando] = useState(false);
  const [enderecoResolvido, setEnderecoResolvido] = useState<EnderecoPublico | null>(null);
  const [avisoBusca, setAvisoBusca] = useState<string | null>(null);

  /**
   * Cada clique aborta a busca anterior: sem isto, uma resposta lenta do
   * ponto A chega depois do ponto B e sobrescreve o formulário com o
   * endereço errado.
   */
  const buscaEmCurso = useRef<AbortController | null>(null);
  useEffect(() => () => buscaEmCurso.current?.abort(), []);

  async function buscarEndereco(lat: number, lng: number) {
    buscaEmCurso.current?.abort();
    const controlador = new AbortController();
    buscaEmCurso.current = controlador;

    setBuscando(true);
    const resultado = await enderecoPorCoordenada(lat, lng, controlador.signal);
    if (controlador.signal.aborted) return;
    setBuscando(false);

    if (resultado.status === "encontrado") {
      setEnderecoResolvido(resultado.endereco);
      aoResolverEndereco?.(resultado.endereco);
      return;
    }
    setAvisoBusca(
      resultado.status === "sem-cep"
        ? "Não encontramos CEP para este ponto. Preencha o endereço à mão — a entrega usa a coordenada marcada."
        : resultado.mensagem,
    );
  }

  function definir(lat: number, lng: number) {
    setPosicao([lat, lng]);
    setEnderecoResolvido(null);
    setAvisoBusca(null);
    aoMudar(lat, lng);
    if (aoResolverEndereco) void buscarEndereco(lat, lng);
  }

  return (
    <div className="mapa-destino">
      <MapContainer
        center={posicao ?? CENTRO_PADRAO}
        zoom={posicao ? 16 : 13}
        style={{ height: 280, width: "100%", borderRadius: "var(--radius)" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <CapturaDeClique aoClicar={definir} />
        {posicao ? (
          <Marker
            position={posicao}
            icon={iconePadrao}
            draggable
            eventHandlers={{
              dragend: (evento) => {
                const alvo = evento.target as L.Marker;
                const { lat, lng } = alvo.getLatLng();
                definir(lat, lng);
              },
            }}
          />
        ) : null}
      </MapContainer>
      <p className="small" style={{ marginTop: "var(--space-2)" }}>
        {posicao
          ? `${posicao[0].toFixed(6)}, ${posicao[1].toFixed(6)} — arraste o pino para ajustar.`
          : "Clique no mapa para marcar o ponto de entrega."}
      </p>
      {buscando ? (
        <p className="small">Buscando o endereço deste ponto…</p>
      ) : null}
      {enderecoResolvido ? (
        <p className="small" style={{ fontWeight: 600 }}>
          {resumirEndereco(enderecoResolvido)}
        </p>
      ) : null}
      {avisoBusca ? (
        <p className="small" style={{ color: "var(--warning, #b45309)" }}>
          {avisoBusca}
        </p>
      ) : null}
    </div>
  );
}
