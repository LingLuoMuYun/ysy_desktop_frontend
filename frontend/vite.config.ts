import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // 使用相对路径，确保 Electron 以 file:// 协议加载时资源正确解析
  base: "./",
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api/environments": {
        target: "http://10.0.78.12:8000",
        changeOrigin: true,
      },
      "/api/health": {
        target: "http://10.0.78.12:8000",
        changeOrigin: true,
      },
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
      "/api/environments": {
        target: "http://10.0.78.12:8000",
        changeOrigin: true,
      },
      "/api/health": {
        target: "http://10.0.78.12:8000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://10.0.1.5:8765",
        changeOrigin: true,
      },
    },
  },
});
