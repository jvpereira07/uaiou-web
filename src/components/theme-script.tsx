import Script from "next/script";

/**
 * Aplica a classe `.dark` do 7Days DS ANTES da primeira pintura.
 *
 * Sem isto o servidor renderiza claro, o React hidrata e só então o tema troca: o usuário leva um
 * flash branco na cara a cada carga — o defeito clássico de tema persistido. Por isso é script e
 * não efeito.
 *
 * `strategy="beforeInteractive"` é a API do Next para exatamente este caso; uma `<script>` solta
 * dentro de um componente funciona no HTML inicial mas não em navegação no cliente, e o React
 * avisa sobre isso em desenvolvimento.
 *
 * A escolha explícita do usuário (localStorage) vence a do sistema; sem escolha, segue o
 * `prefers-color-scheme`. `try/catch` porque `localStorage` lança em modo restrito.
 */
const SCRIPT = `
try {
  var stored = localStorage.getItem("uaiou_theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}
`;

export function ThemeScript() {
  return (
    // A regra `no-before-interactive-script-outside-document` é do Pages Router, onde o lugar do
    // script era `pages/_document.js`. No App Router a documentação do Next manda exatamente o
    // contrário: `beforeInteractive` só é válido no layout raiz — que é de onde este componente é
    // renderizado. A regra não distingue os dois roteadores.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="uaiou-theme" strategy="beforeInteractive">
      {SCRIPT}
    </Script>
  );
}
