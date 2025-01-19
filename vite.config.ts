import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import eslintPlugin from "vite-plugin-eslint";

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    eslintPlugin({
      include: ["src/**/*.vue", "src/**/*.ts"], // Lintuj tylko pliki .vue i .ts
      overrideConfigFile: ".eslintrc.cjs", // Wskaż ręcznie plik konfiguracyjny
    }),
  ],
  esbuild: {
    target: "esnext", // Supports top-level await
  },
  build: {
    target: "esnext", // Ensures modern syntax support
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
