/**
 * Rótulos dos tipos de documento (`Purpose`, T-05). Em módulo próprio, sem `"use client"`: a
 * função é chamada tanto no Server Component da página quanto no formulário de envio, e exportá-la
 * de um módulo cliente a transformaria numa referência de cliente — que quebra ao ser chamada
 * durante a renderização no servidor.
 */
const LABELS: Record<string, string> = {
  CNPJ_DOCUMENT: "Cartão CNPJ",
  IDENTITY_DOCUMENT: "Documento de identidade",
  DRIVER_LICENSE: "CNH",
  VEHICLE_DOCUMENT: "Documento do veículo",
  MERCHANT_LOGO: "Logo do estabelecimento",
  DELIVERY_PROOF: "Comprovante de entrega",
};

export function documentLabel(type: string): string {
  return LABELS[type] ?? type;
}
