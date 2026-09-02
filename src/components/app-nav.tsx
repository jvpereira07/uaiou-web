"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Icon } from "@/components/icons";

/**
 * `icon` é o NOME do ícone, não o componente.
 *
 * Os layouts que montam estes grupos são Server Components, e um componente é uma função —
 * funções não são serializáveis e o React recusa passá-las por essa fronteira ("Functions cannot
 * be passed directly to Client Components"). Uma chave de texto atravessa; a resolução acontece
 * aqui, do lado do cliente.
 */
export type NavItem = { href: Route; label: string; icon: keyof typeof Icon };

export type NavGroup = { label: string; items: readonly NavItem[] };

/**
 * Navegação lateral no formato do AppShell do 7Days DS: grupos rotulados, ícone à esquerda,
 * item ativo em `primary/10` com barra vertical.
 *
 * Marcar o ativo exige o caminho atual, que só existe no cliente — por isso este é o único
 * pedaço cliente do layout.
 *
 * A raiz de cada painel (`/admin`, `/merchant`) casa só exatamente: com `startsWith` ela ficaria
 * acesa em todas as subpáginas, e dois itens ativos ao mesmo tempo não informam nada.
 */
export function AppNav({ groups, root }: { groups: readonly NavGroup[]; root: Route }) {
  const pathname = usePathname();

  return (
    <nav className="app-nav scrollbar-thin" aria-label="Navegação principal">
      {groups.map((group) => (
        <div key={group.label} className="app-nav-group">
          <div className="app-nav-group-label">{group.label}</div>
          {group.items.map((item) => {
            const active =
              item.href === root ? pathname === item.href : pathname.startsWith(item.href);
            const Glyph = Icon[item.icon];

            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
                <Glyph size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
