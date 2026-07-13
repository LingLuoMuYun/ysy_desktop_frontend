const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("ysyDesktop", {
  platform: process.platform,
  selectAttachments() {
    return ipcRenderer.invoke("file:select-attachments");
  },
  getFilePath(file) {
    return webUtils.getPathForFile(file);
  },
  selectDirectory(title) {
    return ipcRenderer.invoke("file:select-directory", title);
  },
  selectFile(title) {
    return ipcRenderer.invoke("file:select-file", title);
  },
  openFile(filePath) {
    return ipcRenderer.invoke("file:open-path", filePath);
  },
  requestEnvironment(request) {
    return ipcRenderer.invoke("environment:request", request);
  },
});
