import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/**
 * A raiz nunca renderiza: o middleware já roteia por papel antes de chegar aqui. Este redirect é a
 * rede de segurança para o caso de o matcher mudar e alguém cair aqui sem querer.
 */
export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "MERCHANT") redirect("/merchant");
  redirect("/sem-painel-web");
}
