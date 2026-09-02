import Image from "next/image";

/**
 * Logotipo oficial (`images-mock/uaiou_logo_horizontal.png`, copiado para `public/uaiou-logo.png`).
 *
 * Antes cada tela desenhava a marca como texto — "UaiOu" com `font-weight: 900`. Isso não é a
 * marca: a fonte é outra, o traço é outro, e cada tela escolhia um tamanho diferente. Aqui existe
 * um componente só, com dois tamanhos, e a proporção 545×148 do arquivo é respeitada em ambos.
 *
 * `priority` no tamanho grande porque a marca é o primeiro elemento da tela de login — carregar
 * depois faria o cartão pular.
 *
 * `unoptimized`: são 8 KB de PNG desenhados a 30 ou 56 px de altura. O otimizador do Next
 * acrescentaria uma ida a `/_next/image` para devolver um arquivo do mesmo tamanho — custo sem
 * ganho, e mais uma peça capaz de falhar entre a marca e a tela.
 */
const RATIO = 545 / 148;

export function Brand({
  size = "sidebar",
  suffix,
}: {
  size?: "sidebar" | "hero";
  suffix?: string;
}) {
  const height = size === "hero" ? 44 : 24;

  return (
    <span className={`brand brand-${size}`}>
      <Image
        src="/uaiou-logo.png"
        alt="UaiOu"
        width={Math.round(height * RATIO)}
        height={height}
        priority={size === "hero"}
        unoptimized
      />
      {suffix ? <span className="brand-suffix">{suffix}</span> : null}
    </span>
  );
}
