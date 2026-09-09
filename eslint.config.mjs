import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Proyecto de referencia exportado de Figma Make — no se instala ni se
    // ejecuta, solo se usa como guía visual (ver AGENTS.md en esa carpeta).
    "figma-reference/**",
  ]),
]);

export default eslintConfig;
