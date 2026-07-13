import type { RuntimeEnvironmentSummary, StatusTone } from "../types/domain";

const DEFAULT_API_BASE = "http://10.0.78.12:8000";
const API_BASE = import.meta.env.VITE_ENVIRONMENTS_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
const API_BASE_CANDIDATES = import.meta.env.DEV && API_BASE !== ""
  ? [API_BASE, ""]
  : [API_BASE];

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: {
    code?: string;
    message?: string;
    suggestion?: string;
  } | null;
  requestId?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
  hasMore: boolean;
  omittedCount?: number;
}

export interface EnvironmentListResult {
  environments: RuntimeEnvironmentSummary[];
  omittedCount: number;
}

interface BackendEnvironment {
  id: string;
  name: string;
  status: string;
  statusText?: string;
  environmentType?: string;
  purpose?: string;
  pythonVersion?: string;
  dependencySummary?: string;
  cudaVersion?: string | null;
  checkStatusText?: string;
  updatedAt?: string;
  updatedAtText?: string;
  canDeleteLocalFiles?: boolean;
  deleteLocalFilesReason?: string;
  environmentManager?: string;
  environmentPath?: string;
  pythonPath?: string;
  condaEnvName?: string | null;
  checkResult?: CheckResult;
}

interface EnvironmentCreateResponse {
  environment: BackendEnvironment;
  job?: {
    jobId: string;
    status: string;
    stage: string;
  };
}

interface CheckResult {
  status: "pass" | "warning" | "failed" | "checking" | string;
  summary: string;
  items?: Array<{
    name: string;
    status: string;
    severity?: string;
    code?: string;
    message?: string;
    suggestion?: string;
    blocking?: boolean;
    value?: string | number | object | null;
  }>;
  checkedAt?: string;
  source?: string;
  warnings?: unknown[];
}

export interface EnvironmentCreateInput {
  mode: "system" | "custom";
  name?: string;
  purpose?: string;
  template?: string;
  python?: string;
  cuda?: string;
  savePath?: string;
  autoCheck: boolean;
  environmentManager?: string;
  packageSource?: string;
  projectDir?: string;
  dependencyFile?: string;
  category?: "llm_inference";
  taskType?: "llm";
  idempotencyKey?: string;
}

export interface EnvironmentImportInput {
  name: string;
  purpose: string;
  environmentPath: string;
  pythonPath: string;
  environmentManager: string;
  condaEnvName?: string;
  autoCheck: boolean;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const ipcRequest = getEnvironmentIpcRequest(path, init);
  if (ipcRequest && window.ysyDesktop?.requestEnvironment) {
    const response = await window.ysyDesktop.requestEnvironment(ipcRequest);
    return parseResponse<T>(response.status, response.data);
  }

  return requestDirect<T>(path, init);
}

async function requestDirect<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response | null = null;
  let lastNetworkError: unknown = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      });
      break;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (!response) {
    throw new Error(
      `${getErrorMessage(lastNetworkError, "无法连接后端服务")}。请确认后端服务已启动，且 ${DEFAULT_API_BASE} 可访问。`,
    );
  }

  return parseResponse<T>(response.status, await response.json().catch(() => null));
}

type EnvironmentIpcRequest =
  | { operation: "list"; status: string }
  | { operation: "create"; body: Record<string, unknown>; idempotencyKey?: string }
  | { operation: "import"; body: Record<string, unknown> }
  | { operation: "delete"; id: string; body: Record<string, unknown> };

function getEnvironmentIpcRequest(path: string, init?: RequestInit): EnvironmentIpcRequest | null {
  const method = init?.method || "GET";
  const body = typeof init?.body === "string" ? JSON.parse(init.body) as unknown : undefined;
  const isBody = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  if (method === "GET" && path.startsWith("/api/environments?")) {
    const status = new URLSearchParams(path.split("?")[1]).get("status") || "all";
    return { operation: "list", status };
  }
  if (method === "POST" && path === "/api/environments" && isBody(body)) {
    return {
      operation: "create",
      body,
      idempotencyKey: new Headers(init?.headers).get("Idempotency-Key") || undefined,
    };
  }
  if (method === "POST" && path === "/api/environments/import" && isBody(body)) {
    return { operation: "import", body };
  }
  if (method === "DELETE" && path.startsWith("/api/environments/") && isBody(body)) {
    const id = decodeURIComponent(path.slice("/api/environments/".length));
    return id ? { operation: "delete", id, body } : null;
  }
  return null;
}

function parseResponse<T>(status: number, data: unknown): T {
  const envelope = data as ApiEnvelope<T> | null;
  if (status < 200 || status >= 300 || !envelope?.success) {
    const responseMessage = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message
      : null;
    const message = envelope?.error?.message
      || envelope?.error?.suggestion
      || responseMessage
      || (status >= 500 ? `运行环境后端内部错误（HTTP ${status}）` : `请求失败：HTTP ${status}`);
    throw new ApiRequestError(message, status);
  }
  return envelope.data;
}

async function recoverEnvironmentList(status: string): Promise<PaginatedResponse<BackendEnvironment> | null> {
  const pages = new Map<number, BackendEnvironment[]>();
  const failedPages = new Set<number>();
  let total: number | null = null;
  let reportedTotal = 0;

  for (let page = 1; page <= 200; page += 1) {
    try {
      const result = await requestDirect<PaginatedResponse<BackendEnvironment>>(
        `/api/environments?${new URLSearchParams({ status, page: String(page), pageSize: "1" }).toString()}`,
      );
      pages.set(page, result.items);
      reportedTotal = result.total;
      total = Math.min(result.total, 200);
      break;
    } catch (error) {
      if (!(error instanceof ApiRequestError) || error.status < 500) throw error;
      failedPages.add(page);
    }
  }

  if (total === null) return null;
  for (let page = 1; page <= total; page += 1) {
    if (pages.has(page) || failedPages.has(page)) continue;
    try {
      const result = await requestDirect<PaginatedResponse<BackendEnvironment>>(
        `/api/environments?${new URLSearchParams({ status, page: String(page), pageSize: "1" }).toString()}`,
      );
      pages.set(page, result.items);
    } catch (error) {
      if (!(error instanceof ApiRequestError) || error.status < 500) throw error;
      failedPages.add(page);
    }
  }

  const items = [...pages.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([, pageItems]) => pageItems);
  return {
    items,
    page: 1,
    pageSize: 20,
    total: items.length,
    hasMore: false,
    omittedCount: failedPages.size + Math.max(0, reportedTotal - total),
  };
}

const environmentListRequests = new Map<string, Promise<EnvironmentListResult>>();

async function loadEnvironmentList(status: string): Promise<EnvironmentListResult> {
  const params = new URLSearchParams({ status, page: "1", pageSize: "20" });
  let page: PaginatedResponse<BackendEnvironment>;
  try {
    page = await request<PaginatedResponse<BackendEnvironment>>(`/api/environments?${params.toString()}`);
  } catch (error) {
    if (window.ysyDesktop?.requestEnvironment || !(error instanceof ApiRequestError) || error.status < 500) {
      throw error;
    }
    const recoveredPage = await recoverEnvironmentList(status);
    if (!recoveredPage) throw error;
    page = recoveredPage;
  }
  return {
    environments: page.items.map(mapEnvironment),
    omittedCount: page.omittedCount || 0,
  };
}

function mapEnvironmentTone(status: string): StatusTone {
  if (status === "available" || status === "pass") return "success";
  if (status === "warning" || status === "unchecked") return "warning";
  if (status === "unavailable" || status === "failed" || status === "error") return "danger";
  if (status === "creating" || status === "checking") return "info";
  return "neutral";
}

const ENVIRONMENT_STATUS_LABELS: Record<string, string> = {
  creating: "创建中",
  checking: "检测中",
  available: "可用",
  unavailable: "不可用",
  unchecked: "未检测",
  pass: "可用",
  warning: "警告",
  failed: "检测失败",
  error: "异常",
};

function formatEnvironmentStatus(environment: BackendEnvironment) {
  const statusText = environment.statusText?.trim();
  if (statusText) {
    return ENVIRONMENT_STATUS_LABELS[statusText.toLowerCase()] || statusText;
  }

  const summary = environment.checkResult?.summary?.trim();
  if (summary) {
    return ENVIRONMENT_STATUS_LABELS[summary.toLowerCase()] || summary;
  }

  return ENVIRONMENT_STATUS_LABELS[environment.status.toLowerCase()] || environment.status;
}

function mapEnvironmentSource(environment: BackendEnvironment): RuntimeEnvironmentSummary["environmentSource"] {
  if ("source" in environment && environment.source === "custom") {
    return "自定义环境";
  }
  if ("source" in environment && environment.source === "system") {
    return "创建系统环境";
  }
  if (environment.environmentManager === "conda" || environment.environmentManager === "venv" || environment.environmentManager === "python") {
    return "导入本地环境";
  }
  if (environment.environmentType === "custom") {
    return "自定义环境";
  }
  return "创建系统环境";
}

function formatPython(version?: string) {
  if (!version) return "Python 待检测";
  return version.startsWith("Python") ? version : `Python ${version}`;
}

function formatCuda(version?: string | null, checkStatusText?: string) {
  if (!version && !checkStatusText) return "CUDA 待检测";
  if (!version) return checkStatusText || "CUDA 待检测";
  const cuda = version.startsWith("CUDA") ? version : `CUDA ${version}`;
  return checkStatusText ? `${cuda} / ${checkStatusText}` : cuda;
}

function formatDependencySummary(summary?: string, fallback?: string) {
  if (!summary) return fallback || "待检测";

  const fields = Object.fromEntries(
    summary
      .split(";")
      .map((item) => item.trim().split(/=(.*)/s))
      .filter(([key, value]) => Boolean(key && value)),
  );
  const framework = fields.framework?.trim();
  if (framework) return framework;

  const dependencyFilePath = fields.dependencyFilePath?.trim();
  if (dependencyFilePath) {
    const fileName = dependencyFilePath.split(/[\\/]/).pop();
    return fileName ? `依赖文件：${fileName}` : "已配置依赖文件";
  }
  if (fields.packages) return "已配置依赖包";
  if (fields.templateCode) return "系统预置模板";

  return summary.length > 72 ? `${summary.slice(0, 72)}...` : summary;
}

export function mapEnvironment(environment: BackendEnvironment): RuntimeEnvironmentSummary {
  return {
    id: environment.id,
    name: environment.name,
    status: formatEnvironmentStatus(environment),
    tone: mapEnvironmentTone(environment.status),
    environmentSource: mapEnvironmentSource(environment),
    purpose: environment.purpose || environment.environmentType || "通用",
    python: formatPython(environment.pythonVersion || ("python" in environment && typeof environment.python === "string" ? environment.python : undefined)),
    framework: formatDependencySummary(
      environment.dependencySummary,
      "framework" in environment && typeof environment.framework === "string" ? environment.framework : undefined,
    ),
    cuda: formatCuda(environment.cudaVersion || ("cuda" in environment && typeof environment.cuda === "string" ? environment.cuda : undefined), environment.checkStatusText),
    updatedAt: environment.updatedAtText || environment.updatedAt || "-",
    canDeleteLocalFiles: Boolean(environment.canDeleteLocalFiles),
    deleteLocalFilesReason: environment.deleteLocalFilesReason,
  };
}

function toCheckStatusSummary(checkResult: CheckResult): Pick<RuntimeEnvironmentSummary, "status" | "tone" | "updatedAt"> {
  if (checkResult.status === "pass") {
    return { status: "可用", tone: "success", updatedAt: checkResult.checkedAt || "刚刚" };
  }
  if (checkResult.status === "warning") {
    return { status: "需修复", tone: "warning", updatedAt: checkResult.checkedAt || "刚刚" };
  }
  if (checkResult.status === "failed") {
    return { status: "不可用", tone: "danger", updatedAt: checkResult.checkedAt || "刚刚" };
  }
  return { status: "检测中", tone: "info", updatedAt: checkResult.checkedAt || "刚刚" };
}

export const environmentsApi = {
  list(status = "all"): Promise<EnvironmentListResult> {
    const activeRequest = environmentListRequests.get(status);
    if (activeRequest) return activeRequest;

    const pendingRequest = loadEnvironmentList(status);
    environmentListRequests.set(status, pendingRequest);
    return pendingRequest.finally(() => {
      if (environmentListRequests.get(status) === pendingRequest) {
        environmentListRequests.delete(status);
      }
    });
  },

  async create(input: EnvironmentCreateInput) {
    const body = input.mode === "system"
      ? {
          mode: "system",
          category: input.category || "llm_inference",
          taskType: input.taskType || "llm",
          autoCheck: input.autoCheck,
          confirmed: true,
        }
      : {
          mode: "custom",
          name: input.name,
          purpose: input.purpose,
          python: input.python,
          packageManager: normalizePackageManager(input.environmentManager),
          savePath: input.savePath,
          packageSource: input.packageSource,
          dependencyFilePath: input.dependencyFile,
          packages: [],
          autoCheck: input.autoCheck,
          confirmed: true,
        };

    const result = await request<EnvironmentCreateResponse>("/api/environments", {
      method: "POST",
      headers: {
        "Idempotency-Key": input.idempotencyKey || createIdempotencyKey(input.mode),
      },
      body: JSON.stringify(body),
    });
    return mapEnvironment(result.environment);
  },

  async importLocal(input: EnvironmentImportInput) {
    const environment = await request<BackendEnvironment>("/api/environments/import", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapEnvironment(environment);
  },

  async delete(id: string, options: { deleteLocalFiles: boolean; deleteLocalFilesConfirmed?: boolean }) {
    return request<{ deleted: boolean; localFilesDeleted?: boolean }>(`/api/environments/${id}`, {
      method: "DELETE",
      body: JSON.stringify({
        confirmed: true,
        deleteLocalFiles: options.deleteLocalFiles,
        ...(options.deleteLocalFiles ? { deleteLocalFilesConfirmed: Boolean(options.deleteLocalFilesConfirmed) } : {}),
      }),
    });
  },
};

function createIdempotencyKey(scope: string) {
  if (globalThis.crypto?.randomUUID) {
    return `env-create-${scope}-${globalThis.crypto.randomUUID()}`;
  }
  return `env-create-${scope}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizePackageManager(value?: string) {
  if (value === "conda+pip") return "conda_pip";
  if (value === "uv" || value === "pip" || value === "mamba" || value === "venv" || value === "conda") return value;
  return "conda_pip";
}
