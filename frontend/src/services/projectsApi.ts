import type { ProjectSummary, StatusTone } from "../types/domain";

const DEFAULT_API_BASE = "http://10.0.221.143:8000";
const API_BASE = import.meta.env.VITE_PROJECTS_API_BASE_URL
  || import.meta.env.VITE_ENVIRONMENTS_API_BASE_URL
  || import.meta.env.VITE_API_BASE_URL
  || DEFAULT_API_BASE;
const API_BASE_CANDIDATES = import.meta.env.DEV && API_BASE !== ""
  ? [API_BASE, ""]
  : [API_BASE];

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: {
    code?: string;
    message?: string;
    detail?: unknown;
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
  hasMore?: boolean;
}

interface BackendProject {
  id: string;
  name: string;
  type?: string;
  status: string;
  statusText?: string;
  description?: string;
  workspace?: string;
  datasetCount?: number;
  taskCount?: number;
  trainingTaskCount?: number;
  deploymentTaskCount?: number;
  modelCount?: number;
  environmentId?: string | null;
  environmentName?: string | null;
  summary?: string;
  updatedAt?: string;
  updatedAtText?: string;
  createdAt?: string;
}

export interface ProjectListInput {
  keyword?: string;
  type?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface ProjectListResult {
  items: ProjectSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProjectStatusOption {
  value: string;
  label: string;
}

export interface ProjectEnvironmentOption {
  id: string;
  name: string;
  purpose?: string;
  status?: string;
  statusText?: string;
}

export interface ProjectSpecs {
  projectTypes: string[];
  statusOptions: ProjectStatusOption[];
  workspaceOptions: string[];
  compatibleEnvironments: ProjectEnvironmentOption[];
}

export interface ProjectCreateInput {
  name: string;
  type: string;
  description?: string;
  workspace: string;
  environmentId?: string;
}

export interface ProjectDetail extends ProjectSummary {
  type: string;
  statusCode: string;
  environmentId?: string | null;
  environmentName?: string | null;
  summary?: string;
  modelCount: number;
  createdAt?: string;
}

export interface PathValidationResult {
  ok: boolean;
  exists: boolean;
  type?: string;
  allowed: boolean;
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

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !envelope?.success) {
    throw new Error(
      envelope?.error?.message
      || envelope?.error?.suggestion
      || `请求失败：HTTP ${response.status}`,
    );
  }

  return envelope.data;
}

function toQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function mapProjectTone(status: string): StatusTone {
  if (status === "trainable") return "success";
  if (status === "pending_config" || status === "preparing" || status === "archived") return "warning";
  if (status === "risk") return "danger";
  if (status === "unavailable") return "danger";
  if (status === "running") return "info";
  return "neutral";
}

function formatDate(project: BackendProject) {
  return project.updatedAtText || project.updatedAt || project.createdAt || "-";
}

function mapProject(project: BackendProject): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    status: project.statusText || project.status,
    statusCode: project.status,
    tone: mapProjectTone(project.status),
    description: project.description || project.summary || "暂无项目描述",
    path: project.workspace || "-",
    type: project.type || "-",
    trainingTasks: project.trainingTaskCount ?? project.taskCount ?? 0,
    deploymentTasks: project.deploymentTaskCount ?? 0,
    datasetCount: project.datasetCount ?? 0,
    modelCount: project.modelCount ?? 0,
    environmentId: project.environmentId,
    environmentName: project.environmentName,
    updatedAt: formatDate(project),
  };
}

function mapProjectDetail(project: BackendProject): ProjectDetail {
  return {
    ...mapProject(project),
    type: project.type || "-",
    statusCode: project.status,
    summary: project.summary,
    modelCount: project.modelCount ?? 0,
    createdAt: project.createdAt,
  };
}

export const projectsApi = {
  async list(input: ProjectListInput): Promise<ProjectListResult> {
    const page = await request<PaginatedResponse<BackendProject>>(`/api/projects${toQuery({ ...input })}`);
    return {
      items: page.items.map(mapProject),
      page: page.page || input.page,
      pageSize: page.pageSize || input.pageSize,
      total: page.total,
      totalPages: page.totalPages ?? (page.total > 0 ? Math.ceil(page.total / input.pageSize) : 0),
      hasMore: Boolean(page.hasMore),
    };
  },

  specs() {
    return request<ProjectSpecs>("/api/projects/specs");
  },

  async detail(projectId: string) {
    const project = await request<BackendProject>(`/api/projects/${encodeURIComponent(projectId)}`);
    return mapProjectDetail(project);
  },

  async create(input: ProjectCreateInput) {
    const project = await request<BackendProject>("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        type: input.type,
        description: input.description || "",
        workspace: input.workspace,
        environmentId: input.environmentId || undefined,
        confirmed: true,
      }),
    });
    return mapProjectDetail(project);
  },

  delete(projectId: string) {
    return request<{ deleted: boolean; projectId: string }>(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
      body: JSON.stringify({
        confirmed: true,
        deleteLocalFiles: false,
      }),
    });
  },

  validateWorkspace(workspace: string) {
    return request<PathValidationResult>("/api/local-files/validate-path", {
      method: "POST",
      body: JSON.stringify({
        path: workspace,
        expect: "directory",
        permission: "write",
      }),
    });
  },
};
