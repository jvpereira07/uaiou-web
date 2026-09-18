"use client";

import { useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";

type CamadaRaster = { urlTemplate: string; maxZoom: number; attribution: string };

/** Reserva quando o backend não entrega a camada: mapa simples é melhor que nenhum. */
const RESERVA: CamadaRaster = {
  urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

const temaEscuro = () => document.documentElement.classList.contains("dark");

/**
 * Fundo dos mapas do painel: tiles do Geoapify servidos pelo backend (com cache e sem expor a
 * chave), no mesmo tema claro/escuro do app. O template vem por `/api/proxy`, porque traz o token
 * do dia e só sai para quem tem sessão; os tiles em si o navegador busca direto no backend.
 *
 * Segue a troca de tema ao vivo: quem guarda o tema é a classe `dark` do `<html>`, então basta
 * observá-la.
 */
export function CamadaMapaBase() {
  const [escuro, setEscuro] = useState<boolean>(temaEscuro);
  const [camada, setCamada] = useState<CamadaRaster | null>(null);

  useEffect(() => {
    const observador = new MutationObserver(() => setEscuro(temaEscuro()));
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    fetch(`/api/proxy/map-tiles/raster/${escuro ? "dark" : "light"}`, {
      signal: controlador.signal,
    })
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error(String(resposta.status));
        return (await resposta.json()) as CamadaRaster;
      })
      .then(setCamada)
      .catch(() => {
        if (!controlador.signal.aborted) setCamada(RESERVA);
      });
    return () => controlador.abort();
  }, [escuro]);

  if (!camada) return null;

  return (
    <TileLayer
      // Trocar de tema recria a camada em vez de misturar tiles dos dois temas.
      key={camada.urlTemplate}
      url={camada.urlTemplate}
      maxNativeZoom={camada.maxZoom}
      maxZoom={20}
      detectRetina={false}
      attribution={camada.attribution}
    />
  );
}
