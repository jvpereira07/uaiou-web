"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { orders } from "@/lib/api/endpoints";
import { ApiError, NetworkError } from "@/lib/api/errors";

/**
 * RF-W02.3 — a criação distingue os erros de negócio porque a AÇÃO de cada um é diferente:
 * sem crédito o caminho é falar com o suporte sobre a cota; endereço não geocodificável é um campo
 * para corrigir ali mesmo. Um "erro ao criar pedido" genérico deixaria o usuário sem saber o que
 * fazer nos dois casos.
 */
export interface CreateOrderState {
  status: "idle" | "error";
  message?: string;
  rule?: string | null;
  /** Campo a destacar (critério de aceite 3). */
  field?: "destination" | "proposedFee" | null;
  /** Quando o problema é cota, a tela mostra o caminho para resolver (critério 2). */
  showCreditsPath?: boolean;
  values?: Record<string, string>;
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createOrderAction(
  _previous: CreateOrderState,
  form: FormData,
): Promise<CreateOrderState> {
  const values: Record<string, string> = {
    proposedFee: text(form, "proposedFee"),
    street: text(form, "street"),
    number: text(form, "number"),
    complement: text(form, "complement"),
    district: text(form, "district"),
    city: text(form, "city"),
    lat: text(form, "lat"),
    lng: text(form, "lng"),
    receiverName: text(form, "receiverName"),
    receiverPhone: text(form, "receiverPhone"),
    expectedDeliveryAt: text(form, "expectedDeliveryAt"),
  };

  if (!values.proposedFee) {
    return { status: "error", message: "Informe o valor do frete.", field: "proposedFee", values };
  }

  try {
    await orders.create({
      proposedFee: values.proposedFee.replace(",", "."),
      expectedDeliveryAt: values.expectedDeliveryAt
        ? new Date(values.expectedDeliveryAt).toISOString()
        : null,
      destination: {
        street: values.street ?? "",
        number: values.number ?? "",
        complement: values.complement || null,
        district: values.district ?? "",
        city: values.city || null,
        // T-11 decidiu coordenadas fornecidas pelo cliente com seam de geocodificação. O formulário
        // aceita as coordenadas quando existirem; sem elas, o backend responde
        // UNGEOCODABLE_ADDRESS e a tela aponta o campo de endereço.
        lat: values.lat || null,
        lng: values.lng || null,
      },
      receiver: {
        name: values.receiverName ?? "",
        phone: values.receiverPhone || null,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "INSUFFICIENT_CREDITS") {
        return {
          status: "error",
          message: error.message,
          rule: error.rule,
          showCreditsPath: true,
          values,
        };
      }
      if (error.code === "UNGEOCODABLE_ADDRESS") {
        return {
          status: "error",
          message: error.message,
          rule: error.rule,
          field: "destination",
          values,
        };
      }
      return { status: "error", message: error.message, rule: error.rule, values };
    }
    if (error instanceof NetworkError) {
      return { status: "error", message: error.message, values };
    }
    throw error;
  }

  revalidatePath("/merchant/pedidos");
  redirect("/merchant/pedidos");
}
