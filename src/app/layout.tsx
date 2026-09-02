import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";

/**
 * Tipografia do 7Days DS: Inter no corpo, JetBrains Mono nos identificadores.
 *
 * `next/font` baixa e hospeda no próprio domínio durante o build — sem `@import` de CDN, que
 * bloquearia a primeira pintura e vazaria a visita para um terceiro. As variáveis alimentam as
 * cadeias `--font-sans`/`--font-mono` declaradas em `globals.css`.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  // `template` evita que cada página repita o nome do produto à mão — e garante que quem esquecer
  // de declarar `metadata` ainda receba o `default`.
  title: { default: "UaiOu — painel", template: "%s · UaiOu" },
  description: "Painel de estabelecimento e administração da UaiOu.",
};

/** Cor da barra do navegador no mobile, uma por esquema — o DS tem os dois. */
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d10" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` no <html>: o `ThemeScript` acrescenta a classe `dark` de
    // propósito antes da hidratação, então o HTML do servidor e o do cliente divergem por
    // construção. Suprimir aqui não esconde bug — descreve a intenção, e o escopo é este único
    // elemento (nada dentro dele deixa de ser verificado).
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
