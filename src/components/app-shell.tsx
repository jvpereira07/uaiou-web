import type { ReactNode } from "react";
import type { Route } from "next";
import { AppNav, type NavGroup } from "@/components/app-nav";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * AppShell do 7Days DS: barra lateral (marca · navegação · usuário) + topbar + main.
 *
 * Os dois painéis — admin e estabelecimento — compartilham esta casca. Antes cada layout repetia a
 * mesma estrutura, e a diferença entre eles era só a lista de links; duplicar a casca garantiria
 * que um dia os dois divergissem sem ninguém decidir isso.
 *
 * O bloco do usuário fica no rodapé da lateral (e não na topbar) porque é onde o DS o coloca: a
 * topbar é do contexto da página, a lateral é de quem você é.
 */
export function AppShell({
  groups,
  root,
  brandSuffix,
  user,
  children,
}: {
  groups: readonly NavGroup[];
  root: Route;
  brandSuffix?: string;
  user: { displayName: string; role: string };
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <Brand suffix={brandSuffix} />
        </div>

        <AppNav groups={groups} root={root} />

        <div className="app-user">
          <span className="app-avatar" aria-hidden="true">
            {user.displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="app-user-name">{user.displayName}</span>
          <span className="app-user-role">{user.role}</span>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <span className="app-topbar-title">{user.role}</span>
          <span style={{ marginLeft: "auto" }} className="row">
            <ThemeToggle />
            <LogoutButton />
          </span>
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
