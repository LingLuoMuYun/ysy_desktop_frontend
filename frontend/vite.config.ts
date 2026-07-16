import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const businessApiTarget = "http://10.0.221.143:8000";
const chatApiTarget = "http://10.0.1.5:8765";
const businessApiProxy = {
  target: businessApiTarget,
  changeOrigin: true,
};

export default defineConfig({
  // 使用相对路径，确保 Electron 以 file:// 协议加载时资源正确解析
  base: "./",
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api/environments": businessApiProxy,
      "/api/projects": businessApiProxy,
      "/api/health": businessApiProxy,
      "/api/home": businessApiProxy,
      "/api/system": businessApiProxy,
      "/api/activity": businessApiProxy,
      "/api/local-tools": businessApiProxy,
      "/api": {
        target: chatApiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4174,
    host: "0.0.0.0",
    proxy: {
      "/api/environments": businessApiProxy,
      "/api/projects": businessApiProxy,
      "/api/health": businessApiProxy,
      "/api/home": businessApiProxy,
      "/api/system": businessApiProxy,
      "/api/activity": businessApiProxy,
      "/api/local-tools": businessApiProxy,
      "/api": {
        target: chatApiTarget,
        changeOrigin: true,
      },
    },
  },
});
