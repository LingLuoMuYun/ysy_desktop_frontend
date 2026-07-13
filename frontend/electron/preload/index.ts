import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld("ysyDesktop", {
  platform: process.platform,
  selectAttachments() {
    return ipcRenderer.invoke("file:select-attachments") as Promise<
      Array<{ name: string; path: string }>
    >;
  },
  getFilePath(file: File) {
    return webUtils.getPathForFile(file);
  },
  selectDirectory(title?: string) {
    return ipcRenderer.invoke("file:select-directory", title) as Promise<string | null>;
  },
  selectFile(title?: string) {
    return ipcRenderer.invoke("file:select-file", title) as Promise<string | null>;
  },
  openFile(filePath: string) {
    return ipcRenderer.invoke("file:open-path", filePath) as Promise<void>;
  },
  requestEnvironment(request: unknown) {
    return ipcRenderer.invoke("environment:request", request) as Promise<{ status: number; data: unknown }>;
  },
});
