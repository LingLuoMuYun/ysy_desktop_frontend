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
  openFile(filePath: string) {
    return ipcRenderer.invoke("file:open-path", filePath) as Promise<void>;
  },
});
