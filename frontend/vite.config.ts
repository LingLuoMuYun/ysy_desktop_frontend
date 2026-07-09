import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://10.0.1.5:8765",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4174,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://10.0.1.5:8765",
        changeOrigin: true,
      },
    },
  },
});
