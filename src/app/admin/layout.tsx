import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavGroup } from "@/components/app-nav";
import { requireSession } from "@/lib/session";

/**
 * Navegação agrupada como no AppShell do 7Days DS. Os grupos não são enfeite: "Moderação" e
 * "Plataforma" são responsabilidades diferentes do mesmo cargo, e separá-las encurta a busca.
 */
const NAV: readonly NavGroup[] = [
  {
    label: "Principal",
    items: [{ href: "/admin", label: "Início", icon: "Dashboard" }],
  },
  {
    label: "Moderação",
    items: [
      { href: "/admin/cadastros", label: "Cadastros", icon: "FileText" },
      { href: "/admin/usuarios", label: "Usuários", icon: "Users" },
      { href: "/admin/suporte", label: "Suporte", icon: "LifeBuoy" },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { href: "/admin/planos", label: "Planos", icon: "CreditCard" },
      { href: "/admin/auditoria", label: "Auditoria", icon: "History" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell
      groups={NAV}
      root="/admin"
      brandSuffix="admin"
      user={{ displayName: session.user.displayName, role: "Administração" }}
    >
      {children}
    </AppShell>
  );
}
