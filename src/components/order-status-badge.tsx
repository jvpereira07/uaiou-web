import { Badge, type BadgeTone } from "@/components/ui";
import type { OrderStatus } from "@/lib/api/types";

/**
 * RF-W02.4 — estado visual claro por etapa. O mapa fica num lugar só para as telas não divergirem
 * sobre o que é "em andamento" e o que é "encerrado".
 */
const LABELS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  created: { label: "Criado", tone: "neutral" },
  published: { label: "Publicado", tone: "info" },
  in_negotiation: { label: "Em negociação", tone: "warning" },
  accepted: { label: "Aceito", tone: "success" },
  finalized: { label: "Finalizado", tone: "neutral" },
  // Contestável não é sucesso nem falha: é uma entrega que fechou sem código, e o estabelecimento
  // precisa olhar. Amarelo comunica exatamente isso.
  contestable_finalized: { label: "Finalizado sem código", tone: "warning" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const entry = LABELS[status] ?? { label: status, tone: "neutral" as BadgeTone };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

export function orderStatusLabel(status: OrderStatus): string {
  return LABELS[status]?.label ?? status;
}
