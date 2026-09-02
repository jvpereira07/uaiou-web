import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // RF-W01.9: a URL da API é lida no SERVIDOR (lib/api/server.ts). Não vai para o bundle do
  // cliente de propósito — o navegador nunca fala com o backend direto, sempre pelo proxy do Next.
  typedRoutes: true,
  experimental: {
    // O documento de cadastro sobe pela Server Action (T-05 permite até 5 MB). O padrão do Next é
    // 1 MB, que recusaria no cliente um arquivo que o backend aceitaria — a folga cobre o overhead
    // da codificação multipart.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
