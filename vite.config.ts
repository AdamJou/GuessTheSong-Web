import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import eslintPlugin from "vite-plugin-eslint";

export default defineConfig({
  base: "/", // WAŻNE: Ustawienie względnej ścieżki dla Firebase

  plugins: [
    vue(),
    vueDevTools(),
    eslintPlugin({
      include: ["src/**/*.vue", "src/**/*.ts"], // Lintuj tylko pliki .vue i .ts
      overrideConfigFile: ".eslintrc.cjs", // Wskaż ręcznie plik konfiguracyjny
    }),
  ],
  build: {
    minify: "esbuild", // Szybsza i bardziej efektywna minifikacja niż Terser
    chunkSizeWarningLimit: 1000, // Ostrzeżenia o rozmiarze pakietów
    target: "esnext",
    emptyOutDir: true, // Usuwa stare pliki przed nowym buildem
    outDir: "dist",
    sourcemap: false,
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
