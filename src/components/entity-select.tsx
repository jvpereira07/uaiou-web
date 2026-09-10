"use client";

import { useId, useMemo, useState } from "react";

export interface EntityOption {
  id: string;
  label: string;
  /** Texto secundário mostrado depois do rótulo (e-mail, autor, data…). */
  hint?: string | null;
}

/** Acima disso a lista deixa de ser navegável só com o olho e ganha campo de busca. */
const SEARCH_THRESHOLD = 8;

/**
 * Seleção de uma entidade já existente pelo nome, submetendo o `id` no `FormData`.
 *
 * RF-W01.10 — o operador nunca deve precisar decorar ou colar UUID: as telas de administração
 * listam o que existe e mandam o identificador por baixo dos panos.
 */
export function EntitySelect({
  name,
  options,
  required,
  placeholder = "Selecione…",
  emptyMessage = "Nenhum registro disponível.",
  defaultValue,
}: {
  name: string;
  options: EntityOption[];
  required?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  defaultValue?: string;
}) {
  const searchId = useId();
  const [term, setTerm] = useState("");

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, term]);

  if (options.length === 0) {
    return (
      <>
        <p className="small">{emptyMessage}</p>
        {/* Mantém o campo no formulário para a validação nativa acusar a ausência. */}
        <input type="hidden" name={name} value="" />
      </>
    );
  }

  return (
    <div className="stack">
      {options.length > SEARCH_THRESHOLD ? (
        <input
          id={searchId}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Filtrar…"
          aria-label="Filtrar opções"
        />
      ) : null}
      <select id={name} name={name} required={required} defaultValue={defaultValue ?? ""}>
        <option value="" disabled>
          {visible.length === 0 ? "Nenhum resultado para o filtro" : placeholder}
        </option>
        {visible.map((option) => (
          <option key={option.id} value={option.id}>
            {option.hint ? `${option.label} — ${option.hint}` : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
