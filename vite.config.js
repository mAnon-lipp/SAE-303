import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "esnext",
  },
  // REMPLACEZ 'sae-303' PAR LE NOM EXACT DE VOTRE DÉPÔT GITHUB
  base: "/sae-303/", 
});
