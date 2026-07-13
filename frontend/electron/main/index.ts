import { app, BrowserWindow, dialog, ipcMain, screen, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const ENVIRONMENTS_API_BASE_URL =
  process.env.ENVIRONMENTS_API_BASE_URL
  || process.env.VITE_ENVIRONMENTS_API_BASE_URL
  || process.env.VITE_API_BASE_URL
  || "http://10.0.78.12:8000";
const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";

let mainWindow: BrowserWindow | null = null;

type EnvironmentRequest =
  | { operation: "list"; status?: string }
  | { operation: "create"; body: Record<string, unknown>; idempotencyKey?: string }
  | { operation: "import"; body: Record<string, unknown> }
  | { operation: "delete"; id: string; body: Record<string, unknown> };

interface EnvironmentProxyResponse {
  status: number;
  data: unknown;
}

const ENVIRONMENT_LIST_PAGE_SIZE = 20;
const ENVIRONMENT_RECOVERY_LIMIT = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEnvironmentRequest(value: unknown): EnvironmentRequest {
  if (!isRecord(value) || typeof value.operation !== "string") {
    throw new Error("无效的环境请求");
  }

  if (value.operation === "list") {
    return { operation: "list", status: typeof value.status === "string" ? value.status : "all" };
  }
  if (value.operation === "create" && isRecord(value.body)) {
    return {
      operation: "create",
      body: value.body,
      idempotencyKey: typeof value.idempotencyKey === "string" ? value.idempotencyKey : undefined,
    };
  }
  if (value.operation === "import" && isRecord(value.body)) {
    return { operation: "import", body: value.body };
  }
  if (value.operation === "delete" && typeof value.id === "string" && isRecord(value.body)) {
    return { operation: "delete", id: value.id, body: value.body };
  }

  throw new Error("无效的环境请求参数");
}

async function fetchEnvironmentApi(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<EnvironmentProxyResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${ENVIRONMENTS_API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = { message: text };
      }
    }
    return { status: response.status, data };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "未知网络错误";
    throw new Error(`无法连接运行环境后端：${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}

function getEnvironmentListPage(data: unknown) {
  if (!isRecord(data) || data.success !== true || !isRecord(data.data)) return null;
  if (!Array.isArray(data.data.items) || typeof data.data.total !== "number") return null;
  return { items: data.data.items, total: data.data.total };
}

async function recoverEnvironmentList(status: string): Promise<EnvironmentProxyResponse | null> {
  const pages = new Map<number, unknown[]>();
  const failedPages = new Set<number>();
  let total: number | null = null;
  let reportedTotal = 0;

  // A single malformed database row can make a whole FastAPI response fail validation.
  // Reading one row per page isolates that row while preserving all valid environments.
  for (let page = 1; page <= ENVIRONMENT_RECOVERY_LIMIT; page += 1) {
    const params = new URLSearchParams({ status, page: String(page), pageSize: "1" });
    const response = await fetchEnvironmentApi(`/api/environments?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    const result = response.status >= 200 && response.status < 300
      ? getEnvironmentListPage(response.data)
      : null;
    if (result) {
      pages.set(page, result.items);
      reportedTotal = result.total;
      total = Math.min(result.total, ENVIRONMENT_RECOVERY_LIMIT);
      break;
    }
    failedPages.add(page);
  }

  if (total === null) return null;

  for (let page = 1; page <= total; page += 1) {
    if (pages.has(page) || failedPages.has(page)) continue;
    const params = new URLSearchParams({ status, page: String(page), pageSize: "1" });
    const response = await fetchEnvironmentApi(`/api/environments?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    const result = response.status >= 200 && response.status < 300
      ? getEnvironmentListPage(response.data)
      : null;
    if (result) {
      pages.set(page, result.items);
    } else {
      failedPages.add(page);
    }
  }

  const items = [...pages.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([, pageItems]) => pageItems);
  return {
    status: 200,
    data: {
      success: true,
      data: {
        items,
        page: 1,
        pageSize: ENVIRONMENT_LIST_PAGE_SIZE,
        total: items.length,
        hasMore: false,
        omittedCount: failedPages.size + Math.max(0, reportedTotal - total),
      },
      error: null,
      requestId: "desktop-recovery",
    },
  };
}

async function requestEnvironmentApi(value: unknown) {
  const request = parseEnvironmentRequest(value);
  const headers: Record<string, string> = { Accept: "application/json" };

  if (request.operation === "list") {
    const status = request.status || "all";
    const params = new URLSearchParams({ status, page: "1", pageSize: String(ENVIRONMENT_LIST_PAGE_SIZE) });
    const response = await fetchEnvironmentApi(`/api/environments?${params.toString()}`, { headers });
    if (response.status < 500) return response;
    return await recoverEnvironmentList(status) || response;
  }

  let path = "/api/environments";
  let method = "POST";
  let body: string;
  headers["Content-Type"] = "application/json";
  if (request.operation === "create") {
    body = JSON.stringify(request.body);
    if (request.idempotencyKey) headers["Idempotency-Key"] = request.idempotencyKey;
  } else if (request.operation === "import") {
    path += "/import";
    body = JSON.stringify(request.body);
  } else {
    path += `/${encodeURIComponent(request.id)}`;
    method = "DELETE";
    body = JSON.stringify(request.body);
  }
  return fetchEnvironmentApi(path, { method, headers, body });
}

const PREFERRED_WINDOW_SIZE = {
  width: 1180,
  height: 700,
  minWidth: 1100,
  minHeight: 640,
};

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
  const { workAreaSize } = screen.getPrimaryDisplay();
  const windowWidth = Math.min(PREFERRED_WINDOW_SIZE.width, workAreaSize.width);
  const windowHeight = Math.min(PREFERRED_WINDOW_SIZE.height, workAreaSize.height);
  const minWidth = Math.min(PREFERRED_WINDOW_SIZE.minWidth, workAreaSize.width);
  const minHeight = Math.min(PREFERRED_WINDOW_SIZE.minHeight, workAreaSize.height);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    useContentSize: true,
    minWidth,
    minHeight,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    title: "桌面智算",
    frame: true,
    titleBarStyle: "default",
    autoHideMenuBar: !isMac,
    backgroundColor: "#ffffff",
    ...(isWindows ? { backgroundMaterial: "mica" as const } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "../preload/index.cjs"),
    },
  });

  mainWindow.webContents.on("preload-error", (_event, _preloadPath, error) => {
    console.error(`[main] preload 加载失败：${error.message}`);
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

// 设置应用名称（影响用户数据目录和窗口标题）
app.setName("桌面智算");

void app.whenReady().then(() => {
  ipcMain.handle("environment:request", (_event, request: unknown) => requestEnvironmentApi(request));

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

  ipcMain.handle("file:select-directory", async (_event, title: unknown) => {
    const result = await dialog.showOpenDialog({
      title: typeof title === "string" ? title : "选择目录",
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : result.filePaths[0] || null;
  });

  ipcMain.handle("file:select-file", async (_event, title: unknown) => {
    const result = await dialog.showOpenDialog({
      title: typeof title === "string" ? title : "选择文件",
      properties: ["openFile"],
    });
    return result.canceled ? null : result.filePaths[0] || null;
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
