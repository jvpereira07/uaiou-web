import type { BadgeTone } from "@/components/ui";
import type { TicketStatus, UserStatus } from "@/lib/api/types";

/**
 * Rótulo e tom de cada situação de conta — o `STATUS_MAP` do 7Days DS, com os estados deste
 * domínio.
 *
 * Em módulo compartilhado porque a listagem e o detalhe do usuário mostram a mesma informação:
 * duplicar o mapa é como duas telas discordarem sobre o que "suspenso" quer dizer.
 *
 * O valor cru do enum (`active`, `banned`) nunca vai para a tela: é vocabulário do banco.
 */
export const USER_STATUS: Record<UserStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Em análise", tone: "warning" },
  active: { label: "Ativo", tone: "success" },
  suspended: { label: "Suspenso", tone: "warning" },
  banned: { label: "Banido", tone: "danger" },
  rejected: { label: "Recusado", tone: "danger" },
};

/** Tolerante a um status que o backend passe a devolver antes de o front conhecer. */
export function userStatus(status: UserStatus) {
  return USER_STATUS[status] ?? { label: status, tone: "neutral" as BadgeTone };
}

/**
 * Situação de um chamado de suporte. Este mapa estava escrito três vezes — duas no painel do
 * estabelecimento e uma pela metade no do admin, que por isso mostrava `resolved` cru na tela.
 */
export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: BadgeTone }> = {
  open: { label: "Aberto", tone: "warning" },
  in_progress: { label: "Em andamento", tone: "info" },
  resolved: { label: "Resolvido", tone: "success" },
};

export function ticketStatus(status: TicketStatus) {
  return TICKET_STATUS[status] ?? { label: status, tone: "neutral" as BadgeTone };
}
