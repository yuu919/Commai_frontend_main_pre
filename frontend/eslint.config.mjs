import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // 型移行中のため、no-explicit-any は警告にダウングレード（段階的に解消予定）
      "@typescript-eslint/no-explicit-any": "warn",
      // v2: 依存の逆流禁止（app → features → (ui|hooks|stores|api) → lib）
      // Enforce reverse dependency only:
      // - app must not be imported by lower layers (features/ui/lib)
      // - features must not be imported by ui
      // Allow: app -> features/ui, features -> ui, (all) -> lib
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            // UI は独立性を保ち、上位(app/features) を import できない
            { target: "./src/ui", from: ["./src/app", "./src/features"] },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
