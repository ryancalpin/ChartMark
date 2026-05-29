import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxy audit-trail calls to the FastAPI service in dev when VITE_USE_REAL_AUDIT=true.
    proxy: {
      "/api/audit": {
        target: process.env.VITE_AUDIT_API_URL ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
