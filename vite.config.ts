import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not load .env files into process.env inside the config,
  // so load them explicitly to read the proxy target.
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_API_PROXY_TARGET || process.env.VITE_API_PROXY_TARGET || "http://localhost:8080";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        // API routes are mounted under /api/v1 on the backend.
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        // Health check lives at /health (no /api/v1 prefix), so proxy it too.
        "/health": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
    },
  };
});
