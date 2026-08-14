import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev-only: the browser calls same-origin /api/*, Vite's Node process
      // forwards to the live backend server-to-server, so CORS never applies.
      // In production this app is expected to sit behind the same origin as
      // the API (or get a real CORS_ALLOWED_ORIGINS entry once deployed).
      "/api": {
        target: "https://crestmont-bank-backend.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
