import "server-only";

import { api } from "./server";
import type {
  AdminOrderDetail,
  AdminUserDetail,
  AuditLogEntry,
  ConfirmUploadResponse,
  CounterofferResponse,
  CourierSummary,
  CreateOrderRequest,
  CreateUploadResponse,
  CreditTransactionSummary,
  DeliveryCodeResponse,
  DocumentSummary,
  DocumentsResponse,
  MeResponse,
  MerchantStatsResponse,
  MerchantSummary,
  NotificationListResponse,
  MyCreditsResponse,
  OrderLifecycleResponse,
  OrderResponse,
  OrderSummary,
  PageResponse,
  PatchMeRequest,
  PayablesResponse,
  PendingRegistrationSummary,
  PendingReviewEntry,
  PlanResponse,
  ReceivedReviewsResponse,
  ReviewDecision,
  SanctionSummary,
  SanctionType,
  ScoreResponse,
  SeriesResponse,
  TicketDetail,
  TicketSummary,
} from "./types";

/**
 * RF-W01.2 — as chamadas concretas, tipadas, num lugar só. A tela pede `orders.list(...)`, não
 * monta URL: caminho errado vira erro de compilação, não 404 em produção.
 */

function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : "";
}

/** A listagem de pedidos devolve envelope com `warning` (RF-11.8) além de `data`/`meta`. */
export interface OrderListResponse extends PageResponse<OrderSummary> {
  warning?: string | null;
}

export const orders = {
  listForMerchant: (params: { page?: number; perPage?: number }) =>
    api.get<OrderListResponse>(`/orders${query(params)}`),
  get: (id: string) => api.get<OrderResponse>(`/orders/${id}`),
  create: (body: CreateOrderRequest) => api.post<OrderResponse>("/orders", body),
  counteroffers: (orderId: string) =>
    api.get<CounterofferResponse[]>(`/orders/${orderId}/counteroffers`),
  decideCounteroffer: (counterofferId: string, outcome: "accepted" | "rejected") =>
    api.put<unknown>(`/counteroffers/${counterofferId}/decision`, { outcome }),
  /** RF-26.7 — a loja entrega o pacote na mão e confirma; só ela pode. */
  confirmPickup: (orderId: string) =>
    api.post<OrderLifecycleResponse>(`/orders/${orderId}/pickup/confirmation`, {}),
  /** RF-26.14 — cancelamento até a coleta, com motivo obrigatório. */
  cancel: (orderId: string, body: { reason: string; note?: string | null }) =>
    api.post<OrderLifecycleResponse>(`/orders/${orderId}/cancellation`, body),
};

export const delivery = {
  /** RF-15.11 — leitura auditada: cada chamada incrementa o contador no backend. */
  code: (orderId: string) => api.get<DeliveryCodeResponse>(`/orders/${orderId}/delivery/code`),
  dispatch: (orderId: string, receiverPhone: string | null) =>
    api.post<unknown>(`/orders/${orderId}/delivery/code-dispatches`, { receiverPhone }),
};

export const uploads = {
  /** RF-05.2 — `purpose` define MIME aceito e tamanho máximo; o backend recusa o que não bate. */
  create: (body: { purpose: string; contentType: string; sizeBytes: number }) =>
    api.post<CreateUploadResponse>("/uploads", body),
  /** RF-05.4 — sem esta confirmação o upload fica órfão e o job de limpeza o remove. */
  confirm: (id: string) => api.put<ConfirmUploadResponse>(`/uploads/${id}`),
};

export const documents = {
  list: () => api.get<DocumentsResponse>("/me/documents"),
  submit: (type: string, uploadId: string) =>
    api.post<DocumentSummary>("/me/documents", { type, uploadId }),
};

export const credits = {
  mine: () => api.get<MyCreditsResponse>("/me/credits"),
  transactions: (params: { page?: number; perPage?: number }) =>
    api.get<PageResponse<CreditTransactionSummary>>(`/me/credits/transactions${query(params)}`),
};

export const ledger = {
  payables: () => api.get<PayablesResponse>("/me/payables"),
};

export const reviews = {
  pending: () => api.get<PendingReviewEntry[]>("/me/reviews?direction=pending"),
  received: () => api.get<ReceivedReviewsResponse>("/me/reviews?direction=received"),
  create: (orderId: string, rating: number, comment: string | null) =>
    api.post<unknown>(`/orders/${orderId}/reviews`, { rating, comment }),
};

export const score = {
  mine: () => api.get<ScoreResponse>("/me/score"),
};

export const profile = {
  mine: () => api.get<MeResponse>("/me"),
  update: (body: PatchMeRequest) => api.patch<MeResponse>("/me", body),
};

export const stats = {
  merchant: (period: string) => api.get<MerchantStatsResponse>(`/me/stats${query({ period })}`),
  series: (metric: string) => api.get<SeriesResponse>(`/me/stats/series${query({ metric })}`),
};

export const tickets = {
  /**
   * `status` é `TicketStatus` no backend — o binding de `@RequestParam` usa `Enum.valueOf`
   * (case-sensitive, ignora o `@JsonCreator` que só vale para corpo JSON), então precisa ir em
   * maiúsculas na query string mesmo com o resto do contrato em minúsculas.
   */
  list: (params: { status?: string; authorType?: string } = {}) =>
    api.get<TicketSummary[]>(
      `/support-tickets${query({ ...params, status: params.status?.toUpperCase() })}`,
    ),
  get: (id: string) => api.get<TicketDetail>(`/support-tickets/${id}`),
  create: (body: {
    subject: string;
    message: string;
    reference?: { type: string; id: string } | null;
  }) => api.post<TicketDetail>("/support-tickets", body),
  addMessage: (id: string, message: string) =>
    api.post<TicketDetail>(`/support-tickets/${id}/messages`, { message }),
  resolve: (id: string, body: { finalResponse: string; adjustmentType?: string | null; adjustmentId?: string | null }) =>
    api.put<TicketDetail>(`/support-tickets/${id}/resolution`, body),
};

export const admin = {
  pendingRegistrations: (params: { page?: number; perPage?: number } = {}) =>
    api.get<PageResponse<PendingRegistrationSummary>>(
      `/admin/registrations${query({ status: "pending", ...params })}`,
    ),
  reviewRegistration: (
    userId: string,
    body: { decision: ReviewDecision; reason: string; documentIds?: string[] },
  ) => api.put<{ userId: string; status: string }>(`/admin/registrations/${userId}/review`, body),
  couriers: (params: { status?: string; search?: string; page?: number; perPage?: number } = {}) =>
    api.get<PageResponse<CourierSummary>>(`/admin/couriers${query(params)}`),
  merchants: (params: { status?: string; search?: string; page?: number; perPage?: number } = {}) =>
    api.get<PageResponse<MerchantSummary>>(`/admin/merchants${query(params)}`),
  user: (id: string) => api.get<AdminUserDetail>(`/admin/users/${id}`),
  sanction: (userId: string, body: { type: SanctionType; reason: string; expiresAt?: string | null }) =>
    api.post<SanctionSummary>(`/admin/users/${userId}/sanctions`, body),
  liftSanction: (sanctionId: string) => api.delete<unknown>(`/admin/sanctions/${sanctionId}`),
  order: (id: string) => api.get<AdminOrderDetail>(`/admin/orders/${id}`),
  auditLogs: (params: {
    adminId?: string;
    action?: string;
    referenceId?: string;
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
  }) => api.get<PageResponse<AuditLogEntry>>(`/admin/audit-logs${query(params)}`),
  plans: (params: { page?: number; perPage?: number } = {}) =>
    api.get<PageResponse<PlanResponse>>(`/admin/plans${query(params)}`),
  createPlan: (body: { name: string; monthlyCredits: number; price: string }) =>
    api.post<PlanResponse>("/admin/plans", body),
  updatePlan: (
    id: string,
    body: { name?: string; monthlyCredits?: number; price?: string; active?: boolean },
  ) => api.put<PlanResponse>(`/admin/plans/${id}`, body),
  assignPlan: (merchantId: string, planId: string) =>
    api.put<unknown>(`/admin/merchants/${merchantId}/plan`, { planId }),
  financialAdjustment: (body: {
    type: string;
    targetUserId: string;
    amount: number;
    reason: string;
    reference: { type: string; id: string };
    lancamentoId?: string | null;
  }) => api.post<unknown>("/admin/financial-adjustments", body),
};

export const notifications = {
  /**
   * RF-W03.3 — a fonte do prazo do degrau 2 é a própria notificação: o payload de
   * `delivery.code_contingency` carrega `orderId` e `deadline` (T-16). O estabelecimento não tem
   * rota de leitura do estado da contingência — `GET /orders/{id}/delivery` é do entregador.
   */
  byType: (type: string) =>
    api.get<NotificationListResponse>(
      `/me/notifications${query({ type, perPage: 100 })}`,
    ),
};

export interface DeviceResponse {
  id: string;
  platform: string;
  appVersion?: string | null;
  lastUsedAt?: string | null;
}

/** `POST/DELETE /me/devices` — upsert pelo token FCM no backend (RF-08.3). */
export const devices = {
  register: (pushToken: string) =>
    api.post<DeviceResponse>("/me/devices", { platform: "web", pushToken }),
  remove: (id: string) => api.delete<unknown>(`/me/devices/${id}`),
};
