import { contextBridge, ipcRenderer, webUtils } from "electron";
contextBridge.exposeInMainWorld("ysyDesktop", {
    platform: process.platform,
    selectAttachments() {
        return ipcRenderer.invoke("file:select-attachments");
    },
    getFilePath(file) {
        return webUtils.getPathForFile(file);
    },
    openFile(filePath) {
        return ipcRenderer.invoke("file:open-path", filePath);
    },
});
