module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "vue-eslint-parser", // Parser dla plików Vue
  parserOptions: {
    parser: "@typescript-eslint/parser", // Parser TypeScript dla <script lang="ts">
    ecmaVersion: 2020,
    sourceType: "module",
    extraFileExtensions: [".vue"],
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "vue/multi-word-component-names": "off", // Wyłącz wymóg wieloczłonowych nazw komponentów
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
