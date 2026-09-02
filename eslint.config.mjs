import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // RF-W01.1: `any` proibido, não só desencorajado.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  { ignores: [".next/**", "node_modules/**"] },
];

export default config;
