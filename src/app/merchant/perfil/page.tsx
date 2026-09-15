import { PageHeader } from "@/components/ui";
import { profile } from "@/lib/api/endpoints";
import { PhotoForm } from "./photo-form";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Perfil" };

/**
 * RF-04.3 — edição de nome, telefone e endereço (incluindo o mapa, ausente na v1 original: o
 * endereço nunca era geocodificado, então não havia como orientar retirada no app do entregador).
 * Campos verificados (CNPJ) não aparecem aqui — exigem upload e reabrem moderação.
 */
export default async function MerchantProfilePage() {
  const me = await profile.mine();

  return (
    <>
      <PageHeader
        title="Perfil"
        description="Nome, telefone e endereço do estabelecimento. O CNPJ é um campo verificado — mude-o pelo suporte."
      />
      <PhotoForm photoUrl={me.profile?.photoUrl} />
      <ProfileForm me={me} />
    </>
  );
}
