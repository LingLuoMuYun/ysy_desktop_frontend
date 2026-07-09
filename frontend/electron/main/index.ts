import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";

let mainWindow: BrowserWindow | null = null;

function getProductionIndexPath() {
  return path.join(__dirname, "../../dist/index.html");
}

function isAllowedNavigation(url: string) {
  if (DEV_SERVER_URL) {
    return url.startsWith(DEV_SERVER_URL);
  }

  return url.startsWith("file://");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 1100,
    minHeight: 720,
    title: "",
    frame: true,
    titleBarStyle: "default",
    autoHideMenuBar: !isMac,
    backgroundColor: "#ffffff",
    ...(isWindows ? { backgroundMaterial: "mica" as const } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "../preload/index.js"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (DEV_SERVER_URL) {
    void mainWindow.loadURL(DEV_SERVER_URL);
    return;
  }

  void mainWindow.loadFile(getProductionIndexPath());
}

void app.whenReady().then(() => {
  ipcMain.handle("file:select-attachments", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
    });

    if (result.canceled) {
      return [];
    }

    return result.filePaths.map((filePath) => ({
      name: path.basename(filePath),
      path: filePath,
    }));
  });

  ipcMain.handle("file:open-path", async (_event, filePath: unknown) => {
    if (typeof filePath !== "string" || filePath.trim().length === 0) {
      throw new Error("无效的文件路径");
    }

    // 优先使用 shell.openPath（打开关联应用）
    const errorMessage = await shell.openPath(filePath);
    if (!errorMessage) {
      return; // 成功
    }

    // 回退：使用 file:// 协议通过系统默认方式打开
    console.warn(`[main] shell.openPath 失败 (${errorMessage})，尝试 shell.openExternal 回退:`, filePath);
    try {
      const normalized = filePath.replace(/\\/g, "/");
      const fileUrl = `file:///${encodeURI(normalized)}`;
      await shell.openExternal(fileUrl);
    } catch (externalError) {
      throw new Error(`无法打开文件: ${errorMessage} / ${String(externalError)}`);
    }
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
