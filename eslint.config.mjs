import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindCanonical from "eslint-plugin-tailwind-canonical-classes";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwindCanonical.configs["flat/recommended"],
  {
    rules: {
      "tailwind-canonical-classes/tailwind-canonical-classes": [
        "warn",
        {
          cssPath: "./app/globals.css",
          calleeFunctions: ["clsx", "twMerge", "cn"],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
