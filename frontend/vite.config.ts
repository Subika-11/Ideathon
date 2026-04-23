// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      // Forward all /api/* requests to the FastAPI backend
      // The backend already has /api prefix on all routes, so NO rewrite needed
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});