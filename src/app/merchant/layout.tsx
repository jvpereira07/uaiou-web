import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import type { NavGroup } from "@/components/app-nav";
import { WebPush } from "@/components/web-push";
import { requireSession } from "@/lib/session";

/** Grupos separam a operação do dia (pedidos) do que se olha de vez em quando (dinheiro, conta). */
const NAV: readonly NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/merchant", label: "Início", icon: "Dashboard" },
      { href: "/merchant/pedidos", label: "Pedidos", icon: "Box" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/merchant/creditos", label: "Créditos", icon: "CreditCard" },
      { href: "/merchant/a-pagar", label: "A pagar", icon: "Receipt" },
    ],
  },
  {
    label: "Desempenho",
    items: [
      { href: "/merchant/avaliacoes", label: "Avaliações", icon: "Star" },
      { href: "/merchant/reputacao", label: "Reputação", icon: "Shield" },
      { href: "/merchant/estatisticas", label: "Estatísticas", icon: "Chart" },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/merchant/perfil", label: "Perfil", icon: "Users" },
      { href: "/merchant/suporte", label: "Suporte", icon: "LifeBuoy" },
    ],
  },
];

export default async function MerchantLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell
      groups={NAV}
      root="/merchant"
      user={{ displayName: session.user.displayName, role: "Estabelecimento" }}
    >
      <WebPush />
      {children}
    </AppShell>
  );
}
