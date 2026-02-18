import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [".next", "dist", "node_modules", "next-env.d.ts", "docs/prototype/static-ui.html"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      eslintConfigPrettier
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser
    }
  }
);
