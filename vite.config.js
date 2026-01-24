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
  // C'est cette ligne qui corrige vos erreurs 404
  base: "/SAE-303/",
});
