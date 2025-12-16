import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [
  // Convert existing Next.js (eslintrc-style) presets to flat config.
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/test-results/**",
      "**/playwright-report/**",
      "**/coverage/**"
    ]
  }
];


