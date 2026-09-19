import type {
  AdminOrderAction,
  BehaviorLimitRule,
  OrderStatus,
  TimeoutAction,
  TimeoutRule,
} from "@/lib/api/types";

/**
 * Vocabulário do painel de entregas. Os códigos (`return_to_showcase`, `timeout.not_picked_up`)
 * são contrato da API e nunca vão crus para a tela.
 */
export const ACTION_LABELS: Record<
  AdminOrderAction,
  { label: string; description: string; danger: boolean }
> = {
  cancel: {
    label: "Cancelar entrega",
    description:
      "Encerra o pedido. Contraofertas pendentes são invalidadas e o código de entrega expira. Não gera taxa de cancelamento.",
    danger: true,
  },
  return_to_showcase: {
    label: "Devolver à vitrine",
    description:
      "Tira o pedido do entregador atual (mesmo já coletado) e volta a oferecê-lo pelo frete proposto.",
    danger: true,
  },
  mark_picked_up: {
    label: "Marcar como coletado",
    description: "Confirma a coleta no lugar do estabelecimento.",
    danger: false,
  },
  finalize: {
    label: "Finalizar entrega",
    description:
      "Marca como entregue sem código. Cria o recebível do entregador se ainda não existir. Em um pedido contestável, antecipa a consolidação.",
    danger: false,
  },
};

export const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "published,in_negotiation", label: "Na vitrine" },
  { value: "accepted", label: "Aceitos" },
  { value: "picked_up", label: "Em rota" },
  { value: "contestable_finalized", label: "Contestáveis" },
  { value: "finalized", label: "Finalizados" },
  { value: "cancelled", label: "Cancelados" },
];

export const OVERVIEW_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: "published", label: "Publicados" },
  { status: "in_negotiation", label: "Em negociação" },
  { status: "accepted", label: "Aceitos" },
  { status: "picked_up", label: "Coletados" },
  { status: "contestable_finalized", label: "Contestáveis" },
  { status: "finalized", label: "Finalizados" },
  { status: "cancelled", label: "Cancelados" },
];

export const TIMEOUT_RULES: Record<TimeoutRule, { label: string; description: string }> = {
  unaccepted: {
    label: "Sem aceite",
    description: "Pedido publicado (ou em negociação) sem entregador desde a criação.",
  },
  not_picked_up: {
    label: "Aceito sem coleta",
    description: "Entregador aceitou e não coletou o pacote desde o aceite.",
  },
  not_delivered: {
    label: "Coletado sem entrega",
    description: "Pacote coletado e entrega não finalizada desde a coleta.",
  },
};

export const TIMEOUT_ACTIONS: Record<TimeoutAction, string> = {
  cancel: "Cancela o pedido",
  return_to_showcase: "Devolve à vitrine",
  flag: "Só sinaliza (sem mudar o estado)",
};

const CANCELLATION_REASONS: Record<string, string> = {
  customer_gave_up: "Cliente desistiu",
  payment_declined: "Pagamento recusado",
  out_of_stock: "Sem estoque",
  order_error: "Erro no pedido",
  courier_delay: "Atraso do entregador",
  other: "Outro",
  admin: "Administração",
  timeout: "Tempo esgotado",
};

export function cancellationReasonLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return CANCELLATION_REASONS[code] ?? code;
}

const EVENT_LABELS: Record<string, string> = {
  "order.created": "Pedido criado",
  "order.assigned": "Entregador atribuído",
  "order.courier_arrived": "Entregador chegou à loja",
  "order.picked_up": "Pacote coletado",
  "order.courier_withdrew": "Entregador desistiu",
  "order.cancelled": "Pedido cancelado",
  "counteroffer.proposed": "Contraoferta proposta",
  "counteroffer.decided": "Contraoferta decidida",
  "delivery.code_contingency": "Contingência do código",
  "delivery.completed": "Entrega registrada",
  "ledger.entry_created": "Lançamento no livro-razão",
  "timeout.unaccepted": "Timeout: sem aceite",
  "timeout.not_picked_up": "Timeout: aceito sem coleta",
  "timeout.not_delivered": "Timeout: coletado sem entrega",
  "admin.order_cancel": "Admin cancelou",
  "admin.order_return_to_showcase": "Admin devolveu à vitrine",
  "admin.order_mark_picked_up": "Admin marcou coleta",
  "admin.order_finalize": "Admin finalizou",
};

export function eventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event;
}

export const LIMIT_RULES: Record<BehaviorLimitRule, { label: string; description: string }> = {
  courier_withdrawals: {
    label: "Desistências do entregador",
    description:
      "Desistências que contam penalidade. Ao atingir o máximo na janela, o entregador fica sem aceitar pedidos pelo tempo de bloqueio.",
  },
  merchant_cancellations: {
    label: "Cancelamentos da loja",
    description:
      "Cancelamentos feitos pelo próprio estabelecimento (os da administração e de timeout não contam). Ao atingir o máximo, a loja fica sem publicar pedidos.",
  },
};
