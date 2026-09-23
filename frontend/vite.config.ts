import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/static/evidence": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/api/v1/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
    },
  },
});
