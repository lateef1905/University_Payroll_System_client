import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development the API is proxied, so the browser talks to one origin and the
// Django server needs no CORS configuration. Point API_PROXY_TARGET elsewhere if needed.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target: env.API_PROXY_TARGET || "http://127.0.0.1:8000", changeOrigin: true },
      },
    },
  };
});
