import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  globalIgnores(["dist/"]),
  reactHooks.configs["recommended-latest"],
  reactRefresh.configs.vite,
  {
    plugins: { js, react },
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    extends: [js.configs.recommended],
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/prop-types": 0,
    },
    settings: { react: { version: "18.2" } },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2020 },
    },
  },
  {
    files: ["**/context/**/*.jsx", "**/context/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  prettier,
]);
