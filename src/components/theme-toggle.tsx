"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";

/**
 * Alternador claro/escuro da Topbar do 7Days DS.
 *
 * O tema já foi aplicado por `ThemeScript` antes da primeira pintura; aqui só existe o controle.
 * Quem guarda o estado é o `<html class="dark">` — não este componente. Isso não é detalhe: se o
 * botão mantivesse uma cópia própria, duas abas (ou o próprio script de boot) poderiam discordar
 * do que está na tela.
 *
 * Ler um sistema externo é exatamente o caso de `useSyncExternalStore`; um `useEffect` que chama
 * `setState` no corpo provocaria render em cascata e ainda arriscaria divergir do DOM.
 * `getServerSnapshot` devolve `false` porque no servidor não há classe para inspecionar — o boot
 * corrige antes de qualquer pintura.
 */
const THEME_KEY = "uaiou_theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // Modo restrito bloqueia o storage: o tema vale para esta aba e pronto. Falhar em persistir
      // não pode derrubar o clique.
    }
  }

  const label = dark ? "Usar tema claro" : "Usar tema escuro";

  return (
    <button type="button" className="icon-button" onClick={toggle} aria-pressed={dark} title={label}>
      <span className="sr-only">{label}</span>
      {dark ? <Icon.Sun size={17} /> : <Icon.Moon size={17} />}
    </button>
  );
}
