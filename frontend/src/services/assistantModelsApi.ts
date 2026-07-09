import type { AssistantModelDetail, AssistantModelSummary, StatusTone } from "../types/domain";

const DEFAULT_API_BASE = "http://10.0.1.5:8765";
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
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

interface BackendAssistantModel {
  id: string;
  name: string;
  vendor?: string;
  provider?: string;
  endpoint: string;
  apiKeyMasked?: string | null;
  modelId: string;
  contextLength: number | string;
  temperature?: number | string | null;
  maxOutput: number | string;
  status: "pending_check" | "available" | "error" | string;
  isDefault: boolean;
  lastTestAt?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface AssistantModelFormInput {
  name: string;
  vendor: string;
  apiBaseUrl: string;
  modelId: string;
  apiKey?: string;
  contextLength: string;
  maxOutput: string;
  temperature: string;
}

interface TestModelResult {
  status: string;
  message: string;
  lastTestAt: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response | null = null;
  let lastNetworkError: unknown = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
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

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !envelope?.success) {
    throw new Error(envelope?.error?.message || `请求失败：HTTP ${response.status}`);
  }

  return envelope.data;
}

function mapStatus(status: BackendAssistantModel["status"]): {
  status: string;
  tone: StatusTone;
  connectionStatus: string;
  variant: AssistantModelSummary["variant"];
} {
  if (status === "available") {
    return { status: "可用", tone: "success", connectionStatus: "可用", variant: "blue" };
  }
  if (status === "error") {
    return { status: "异常", tone: "danger", connectionStatus: "连接失败", variant: "dark" };
  }
  return { status: "待检测", tone: "warning", connectionStatus: "待检测", variant: "warm" };
}

function formatContext(value: number | string) {
  if (typeof value === "string") {
    return value.startsWith("上下文") ? value : `上下文 ${value}`;
  }
  if (value >= 1024 * 1024 && value % (1024 * 1024) === 0) {
    return `上下文 ${value / (1024 * 1024)}M`;
  }
  if (value >= 1024 && value % 1024 === 0) {
    return `上下文 ${value / 1024}K`;
  }
  return `上下文 ${value.toLocaleString()}`;
}

function formatNumber(value: number | string) {
  const numberValue = typeof value === "number" ? value : Number.parseInt(String(value).replace(/,/g, ""), 10);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : String(value);
}

function normalizeProvider(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "custom";
}

function toBackendPayload(input: AssistantModelFormInput, includeApiKey: boolean) {
  const apiKey = input.apiKey?.trim();
  return {
    name: input.name.trim(),
    vendor: input.vendor.trim() || "自定义",
    provider: normalizeProvider(input.vendor),
    endpoint: input.apiBaseUrl.trim(),
    ...(includeApiKey && apiKey ? { apiKey } : {}),
    modelId: input.modelId.trim(),
    contextLength: input.contextLength.replace(/^上下文\s*/, "").trim(),
    maxOutput: input.maxOutput.replace(/,/g, "").trim(),
    temperature: Number.parseFloat(input.temperature) || 0.1,
  };
}

export function mapAssistantModel(model: BackendAssistantModel): AssistantModelDetail {
  const mappedStatus = mapStatus(model.status);
  const apiKeyMasked = model.apiKeyMasked || "";
  return {
    id: model.id,
    name: model.name,
    status: mappedStatus.status,
    tone: mappedStatus.tone,
    provider: model.vendor || model.provider || "自定义",
    context: formatContext(model.contextLength),
    isDefault: model.isDefault,
    variant: mappedStatus.variant,
    apiBaseUrl: model.endpoint,
    modelId: model.modelId,
    apiKey: apiKeyMasked,
    apiKeyConfigured: apiKeyMasked.length > 0,
    connectionStatus: model.errorMessage || mappedStatus.connectionStatus,
    maxOutput: formatNumber(model.maxOutput),
    temperature: String(model.temperature ?? 0.1),
  };
}

export const assistantModelsApi = {
  async list() {
    const models = await request<BackendAssistantModel[]>("/api/settings/assistant/models");
    return models.map(mapAssistantModel);
  },

  async create(input: AssistantModelFormInput) {
    const model = await request<BackendAssistantModel>("/api/settings/assistant/models", {
      method: "POST",
      body: JSON.stringify(toBackendPayload(input, true)),
    });
    return mapAssistantModel(model);
  },

  async update(id: string, input: AssistantModelFormInput) {
    const model = await request<BackendAssistantModel>(`/api/settings/assistant/models/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toBackendPayload(input, Boolean(input.apiKey?.trim()))),
    });
    return mapAssistantModel(model);
  },

  async setDefault(id: string) {
    const model = await request<BackendAssistantModel>(`/api/settings/assistant/models/${id}/set-default`, {
      method: "POST",
    });
    return mapAssistantModel(model);
  },

  async test(id: string) {
    return request<TestModelResult>(`/api/settings/assistant/models/${id}/test`, {
      method: "POST",
    });
  },

  async delete(id: string) {
    await request<{ deleted: boolean }>(`/api/settings/assistant/models/${id}?confirmed=true`, {
      method: "DELETE",
    });
  },
};
