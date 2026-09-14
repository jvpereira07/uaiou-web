/**
 * Tipos do contrato (system-documentation/api). Escritos à mão a partir da documentação e dos DTOs
 * do backend — quando existir a spec OpenAPI (anotada como "próximo passo" em api/README.md), estes
 * tipos passam a ser gerados e este arquivo sai.
 *
 * Convenção que vale para o arquivo inteiro: **dinheiro é `string` decimal**, nunca `number`
 * (RF-W01.8). Converter para float aqui perderia precisão antes mesmo de a tela renderizar.
 */

export type Role = "COURIER" | "MERCHANT" | "ADMIN";
export type UserStatus = "pending" | "active" | "suspended" | "banned" | "rejected";

/** Valor monetário como veio do contrato: decimal em string, ex.: `"1234.56"`. */
export type Money = string;

export interface LinkRef {
  href: string;
  method?: string;
}

/** `_links` do contrato. RF-W01.5: a interface LÊ isto em vez de reimplementar a regra. */
export type Links = Record<string, LinkRef | undefined>;

export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
}

export interface PageResponse<T> {
  data: T[];
  meta: PageMeta;
  _links?: Links;
}

export interface SessionUser {
  id: string;
  role: Role;
  status: UserStatus;
  displayName: string;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
  _links?: Links;
}

// ---------------------------------------------------------------- cadastro (T-03)

export interface RegisterRequest {
  role: Role;
  login: string;
  email: string;
  password: string;
  displayName: string;
  profile: {
    cpf?: string;
    vehicleType?: string;
    vehiclePlate?: string;
    cnpj?: string;
    businessName?: string;
  };
}

export interface RegisterResponse {
  id: string;
  role: Role;
  status: UserStatus;
  requiredDocuments: string[];
  _links?: Links;
}

// ---------------------------------------------------------------- uploads (T-05)

export type UploadStatus = "awaiting_upload" | "ready" | "expired";

/** `POST /uploads` — devolve a URL pré-assinada do MinIO para o PUT dos bytes. */
export interface CreateUploadResponse {
  id: string;
  status: UploadStatus;
  uploadUrl: string;
  expiresAt: string;
  maxSizeBytes: number;
  _links?: Links;
}

/** `PUT /uploads/{id}` — confirma que os bytes chegaram; só aqui o upload vira `ready`. */
export interface ConfirmUploadResponse {
  id: string;
  status: UploadStatus;
  fileUrl: string;
  checksum: string;
  _links?: Links;
}

// ---------------------------------------------------------------- pedidos (T-11/T-13/T-14)

export type OrderStatus =
  | "created"
  | "published"
  | "in_negotiation"
  | "accepted"
  | "finalized"
  | "contestable_finalized"
  | "cancelled";

export interface DestinationResponse {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district: string;
  city?: string | null;
  lat?: string | null;
  lng?: string | null;
}

export interface MerchantRef {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface OrderSummary {
  id: string;
  number: string;
  status: OrderStatus;
  proposedFee: Money;
  distanceKm?: string | null;
  merchant?: MerchantRef | null;
  destination: DestinationResponse;
  createdAt: string;
  acceptedAt?: string | null;
  _links?: Links;
}

/**
 * `GET /orders/{id}` — espelha exatamente o `OrderResponse` do backend (T-11), nem um campo a mais.
 *
 * Duas ausências que a interface precisa respeitar em vez de contornar:
 *
 * - **Sem `score` do entregador atribuído.** RF-W02.5 pede o score aqui, mas RF-20.8 restringe a
 *   visibilidade ao contexto de decisão (listagem de contraofertas) — "fora disso, ninguém vê score
 *   alheio". O backend implementou a regra restritiva e não expõe o campo. Seguir a regra de
 *   privacidade em vez de alterar o backend é a escolha registrada aqui.
 * - **Sem `acceptedAt`/`finalizedAt`.** A linha do tempo completa existe só no espelho
 *   administrativo (`AdminOrderDetail.timeline`, RF-21.8). O detalhe do estabelecimento monta o que
 *   dá com os dados reais que tem — inventar marcos seria pior que mostrar menos.
 */
export interface OrderResponse {
  id: string;
  number: string;
  status: OrderStatus;
  proposedFee: Money;
  finalFee?: Money | null;
  creditsConsumed: number;
  createdAt: string;
  expectedDeliveryAt?: string | null;
  destination: DestinationResponse;
  receiver?: { name: string; phone?: string | null } | null;
  courier?: { id: string; name: string } | null;
  _links?: Links;
}

export interface CreateOrderRequest {
  proposedFee: Money;
  expectedDeliveryAt?: string | null;
  destination: {
    street: string;
    number: string;
    complement?: string | null;
    district: string;
    city?: string | null;
    lat?: string | null;
    lng?: string | null;
  };
  receiver: { name: string; phone?: string | null };
}

export type CounterofferStatus = "pending" | "accepted" | "rejected" | "invalidated";

export interface CounterofferResponse {
  id: string;
  orderId: string;
  courierId: string;
  courierName?: string | null;
  /** RF-W02.6/RF-20.8 — insumo de decisão; `null` quando o entregador ainda não tem base. `BigDecimal` cru: number. */
  courierScore?: number | null;
  proposedFee: Money;
  status: CounterofferStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export interface CounterofferDecisionResponse {
  id: string;
  status: CounterofferStatus;
  proposedFee: Money;
  order: { id: string; status: OrderStatus; finalFee?: Money | null };
  _links?: Links;
}

// ---------------------------------------------------------------- entrega (T-15/T-16/T-17)

export type DeliveryCodeStatus = "issued" | "validated" | "expired" | "blocked";

export interface DeliveryCodeResponse {
  orderId: string;
  /** `null` quando o código está bloqueado — a rota existe, o valor não é mais legível. */
  code: string | null;
  status: DeliveryCodeStatus;
  expiresAt: string;
  audit: { readCount: number; lastReadAt?: string | null };
  _links?: Links;
}

export interface CodeDispatchResponse {
  orderId: string;
  dispatchedAt: string;
  _links?: Links;
}

export type FinalizationType = "code" | "contestable";

// ---------------------------------------------------------------- livro-razão (T-18)

export type LedgerStatus = "receivable" | "settled";

export interface PayablesResponse {
  total: Money;
  byCourier: {
    courierId: string;
    courierName?: string | null;
    total: Money;
    entries: {
      id: string;
      orderId: string;
      orderNumber?: string | null;
      amount: Money;
      status: LedgerStatus;
      createdAt: string;
    }[];
  }[];
}

// ---------------------------------------------------------------- créditos (T-09)

export type SubscriptionStatus = "active" | "canceled" | "past_due";

export interface MyCreditsResponse {
  creditsBalance: number;
  /** `null` quando o estabelecimento ainda não tem plano atribuído pelo admin (RF-W04.2). */
  subscription: {
    planName: string;
    monthlyCredits: number;
    consumedThisCycle: number;
    renewsAt: string;
    status: SubscriptionStatus;
  } | null;
  _links?: Links;
}

/**
 * Valores de `CreditTransactionType` COMO CHEGAM NO JSON.
 *
 * O `@JsonValue` do enum devolve `name().toLowerCase()`; os termos em português
 * (`cota_mensal`…) que aparecem no `CreditTransactionTypeConverter` são da coluna do banco e
 * nunca cruzam a API. Tipar como união em vez de `string` faz o compilador cobrar o mapa de
 * rótulos completo — foi assim que a divergência apareceu.
 */
export type CreditTransactionType = "monthly_quota" | "posting_consumption" | "adjustment";

export interface CreditTransactionSummary {
  id: string;
  type: CreditTransactionType;
  quantity: number;
  orderId?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------- avaliações (T-19)

export interface PendingReviewEntry {
  orderId: string;
  orderNumber?: string | null;
  counterpartyId: string;
  counterpartyName?: string | null;
  deadline: string;
}

export interface ReceivedReviewsResponse {
  summary: { average: number | null; activeRate: number | null; count: number };
  data: {
    id: string;
    orderId: string;
    orderNumber?: string | null;
    rating: number;
    comment?: string | null;
    active: boolean;
    createdAt: string;
  }[];
}

// ---------------------------------------------------------------- score (T-20)

/**
 * `GET /me/score` — `value`/`weight`/`contribution` são `BigDecimal` cru no backend, sem
 * `@JsonFormat(shape = STRING)`: chegam como **number** JSON, não como `Money`-style string.
 * Diferente do resto do arquivo, aqui `parseFloat` não é o problema — o próprio contrato já entrega
 * número, e é score/peso/percentual, não valor monetário que precise de precisão decimal exata.
 */
export interface ScoreResponse {
  /** `null` é "sem base" (RF-20.9), NUNCA zero — a tela precisa distinguir os dois. */
  value: number | null;
  window: string;
  calculatedAt?: string | null;
  components: {
    name: string;
    value?: number | null;
    weight: number;
    contribution?: number | null;
  }[];
  /** Só existe para o estabelecimento (RF-20.6). */
  penalties?: { motivo: string; pedidoId: string; createdAt: string }[] | null;
}

// ---------------------------------------------------------------- estatísticas (T-22)

export interface StatsPeriod {
  label: string;
  from: string;
  to: string;
}

/** `matchRate`/`counterofferAcceptRate`/`codeContingencyRate` são `BigDecimal` cru: number, 0..1. */
export interface MerchantStatsResponse {
  period: StatsPeriod;
  ordersPublished: number;
  ordersCompleted: number;
  matchRate: number;
  medianTimeToAssignmentMinutes?: number | null;
  counterofferAcceptRate: number;
  spread: Money;
  freightSpend: Money;
  creditsConsumed: number;
  creditsQuota?: number | null;
  /** RF-22.4 — obrigatória; nunca omitida, mesmo quando zero. */
  codeContingencyRate: number;
}

export interface SeriesResponse {
  metric: string;
  granularity: string;
  data: { date: string; value: number }[];
}

// ---------------------------------------------------------------- suporte (T-21)

export type TicketStatus = "open" | "in_progress" | "resolved";

export interface TicketSummary {
  id: string;
  subject: string;
  status: TicketStatus;
  authorId: string;
  authorName?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  /** RF-21.10/RF-W05.5 — chamado de pedido `finalizado_contestavel` é destacado na fila. */
  contestedDelivery: boolean;
  createdAt: string;
}

export interface TicketDetail extends TicketSummary {
  adminId?: string | null;
  adjustmentType?: string | null;
  adjustmentId?: string | null;
  resolvedAt?: string | null;
  messages: {
    id: string;
    authorId: string;
    authorName?: string | null;
    isAdmin: boolean;
    text: string;
    createdAt: string;
  }[];
  _links?: Links;
}

// ---------------------------------------------------------------- admin (T-07/T-21)

/** Espelha `DocumentApprovalStatus` do backend (T-06). */
export type DocumentApprovalStatus = "pending" | "approved" | "rejected" | "superseded";

export interface DocumentReviewItem {
  documentId: string;
  type: string;
  status: DocumentApprovalStatus;
  /** URL assinada do documento (T-05) — expira; nunca cacheada além do tempo de exibição. */
  fileUrl: string;
}

/** `GET /admin/registrations` — uma linha da fila (RF-07.3). Só suporta `status=pending`. */
export interface PendingRegistrationSummary {
  userId: string;
  role: Role;
  displayName: string;
  email: string;
  registeredAt: string;
  documents: DocumentReviewItem[];
}

export type ReviewDecision = "approved" | "rejected";

export interface DocumentSummary {
  id: string;
  type: string;
  status: DocumentApprovalStatus;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface DocumentsResponse {
  documents: DocumentSummary[];
  missingTypes: string[];
}

export interface CourierLocation {
  lat: string;
  lng: string;
  updatedAt: string;
}

/**
 * Endereço do próprio estabelecimento (`GET`/`PATCH /me`) — não confundir com o destino do
 * pedido (`DestinationResponse`, campos `street`/`number`/`district`/`city`). Este espelha
 * `users/dto/Address.java`: nomes em português, e `lat`/`lng` nunca geocodificados pelo servidor
 * (o estabelecimento marca no mapa, ou ficam ausentes).
 */
export interface Address {
  bairro?: string | null;
  rua?: string | null;
  numero?: string | null;
  cidade?: string | null;
  cep?: string | null;
  lat?: string | null;
  lng?: string | null;
}

/**
 * `MeProfile` — formato único para os dois papéis (RF-04.1): campos que não se aplicam ao `role`
 * do usuário chegam ausentes do JSON (`non_null`), não como `null` explícito.
 */
export interface MeProfile {
  cpf?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  available?: boolean;
  location?: CourierLocation;
  completedDeliveries?: number;
  cnpj?: string;
  businessName?: string;
  logoObjectKey?: string;
  address?: Address;
  /** `BigDecimal` com `@JsonFormat(shape = STRING)`: chega como string, ao contrário de score/stats. */
  score?: string;
  /** Só entregador — ausente enquanto ele não escolheu (V22). */
  paymentMethod?: PaymentMethod;
}

/** `PaymentMethod` do backend — forma de pagamento aceita pelo entregador. */
export type PaymentMethod = "cash" | "credit" | "debit" | "pix";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  pix: "Pix",
};

/** `GET`/`PATCH /me` — bootstrap do usuário logado (`MeResponse.java`). */
export interface MeResponse {
  id: string;
  role: string;
  status: string;
  displayName: string;
  email: string;
  telefone?: string | null;
  profile?: MeProfile;
  /** Presente só na resposta de `PATCH`: campos verificados que entraram em moderação. */
  pendingFields?: string[];
}

/**
 * `PATCH /me` — só os campos alterados (RF-04.3). `profile.lat`/`profile.lng` só se aplicam
 * juntos: o backend rejeita um sem o outro (`INCOMPLETE_COORDINATES`).
 */
export interface PatchMeRequest {
  displayName?: string;
  telefone?: string;
  profile?: {
    bairro?: string;
    rua?: string;
    numero?: string;
    cidade?: string;
    cep?: string;
    lat?: string;
    lng?: string;
  };
}

export type SanctionType = "suspension" | "ban";

export interface SanctionSummary {
  id: string;
  userId: string;
  type: SanctionType;
  reason: string;
  start: string;
  end?: string | null;
  active: boolean;
  adminId?: string | null;
  createdAt: string;
}

/** `GET /admin/couriers` — uma linha (RF-07.8). `score` é string (`@JsonFormat` explícito). */
export interface CourierSummary {
  id: string;
  displayName: string;
  email: string;
  status: UserStatus;
  cpf?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  available: boolean;
  completedDeliveries: number;
  score?: string | null;
  createdAt: string;
}

/** `GET /admin/merchants` — uma linha (RF-07.8). */
export interface MerchantSummary {
  id: string;
  displayName: string;
  email: string;
  status: UserStatus;
  cnpj?: string | null;
  businessName?: string | null;
  score?: string | null;
  createdAt: string;
}

/** `GET /admin/users/{id}` — perfil completo (RF-07.8). Sem campo `score` próprio: vive em `profile.score`. */
export interface AdminUserDetail {
  id: string;
  role: Role;
  status: UserStatus;
  displayName: string;
  username: string;
  email: string;
  telefone?: string | null;
  profile: MeProfile;
  documents: DocumentsResponse;
  sanctions: SanctionSummary[];
  /** RF-12.7 — só para entregador; nulo para estabelecimento. */
  blockedByMerchantCount?: number | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  number: string;
  status: OrderStatus;
  merchant?: { id: string; name: string } | null;
  courier?: { id: string; name: string } | null;
  finalFee?: Money | null;
  contestedDelivery: boolean;
  /** RF-21.8 — composta por união de várias tabelas; nunca inclui o código de entrega (RF-21.9). */
  timeline: { at: string; event: string; details?: Record<string, unknown> | null }[];
  _links?: Links;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  admin?: { id: string; name: string } | null;
  /** `BigDecimal` com `@JsonFormat(shape = STRING)`: string, não number. */
  amount?: string | null;
  reason?: string | null;
  reference?: { type: string; id: string } | null;
  createdAt: string;
}

export interface PlanResponse {
  id: string;
  name: string;
  monthlyCredits: number;
  price: Money;
  active: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------- notificações (T-08)

export type NotificationPriority = "normal" | "urgent";

export interface NotificationSummary {
  id: string;
  type: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  data: NotificationSummary[];
  meta: { page: number; perPage: number; total: number; unread: number };
}

// ---------------------------------------------------------------- geocodificação inversa

/**
 * `GET /geocoding/reverse` — o salto coordenada -> CEP do seletor de endereço no mapa.
 *
 * Todo campo é anulável, inclusive todos ao mesmo tempo: o provedor devolve o que o mapa tem
 * naquele ponto, e "não sei o endereço daqui" é resposta legítima (200), não erro. Quem clicou já
 * tem a coordenada, que é o dado que a entrega usa.
 */
export interface ReverseGeocodingResponse {
  /** Só dígitos — `01014000`, nunca `01014-000`. */
  postalCode: string | null;
  street: string | null;
  district: string | null;
  city: string | null;
  /** Sigla da UF. */
  state: string | null;
}
