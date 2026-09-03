import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // These views render authenticated object URLs and locked visual-reference
    // assets that cannot safely pass through Next's unauthenticated image proxy.
    files: [
      "src/components/BusinessPortalManager.tsx",
      "src/components/EquipmentView.tsx",
      "src/components/JobDetailView.tsx",
      "src/components/MaterialsView.tsx",
      "src/components/ProjectsView.tsx",
      "src/components/locked-exact-home.tsx",
      "src/components/locked-mobile-home.tsx",
      "src/components/yourplan-public.tsx",
    ],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    // Generated immutable homepage reference fragments intentionally export
    // their captured literal directly.
    files: ["src/lib/exact-home-*.ts", "src/lib/locked-home-*.ts"],
    rules: { "import/no-anonymous-default-export": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Archived UI mockups are visual references, not production source.
    "docs/design-reference/**",
  ]),
]);

export default eslintConfig;
