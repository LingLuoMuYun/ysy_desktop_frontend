export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  tone: StatusTone;
  description: string;
  path: string;
  trainingTasks: number;
  deploymentTasks: number;
  datasetCount: string;
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  name: string;
  status: string;
  tone: StatusTone;
  progress: string;
  project: string;
  assetLabel: string;
  environment: string;
  updatedAt: string;
  canStop: boolean;
}

export interface DatasetSummary {
  id: string;
  name: string;
  status: string;
  tone: StatusTone;
  path: string;
  format: string;
  samples: string;
  project: string;
  updatedAt: string;
}

export interface ModelSummary {
  id: string;
  name: string;
  status: string;
  tone: StatusTone;
  path: string;
  type: string;
  source: string;
  project: string;
  updatedAt: string;
}

export interface RuntimeEnvironmentSummary {
  id: string;
  name: string;
  status: string;
  tone: StatusTone;
  environmentSource?: "创建系统环境" | "导入本地环境" | "自定义环境";
  purpose: string;
  python: string;
  framework: string;
  cuda: string;
  updatedAt: string;
  canDeleteLocalFiles?: boolean;
  deleteLocalFilesReason?: string;
}

/** 环境检测单项结果 */
export interface EnvironmentCheckItem {
  label: string;
  passed: boolean;
  detail?: string;
}

/** 运行环境详情（点击环境卡片后展示） */
export interface RuntimeEnvironmentDetail extends RuntimeEnvironmentSummary {
  lastCheckTime: string;
  lastCheckResult: string;
  checkItems: EnvironmentCheckItem[];
  suggestion: string;
}

export interface AssistantModelSummary {
  id: string;
  name: string;
  status: string;
  tone: StatusTone;
  provider: string;
  context: string;
  isDefault: boolean;
  variant: "blue" | "warm" | "dark";
}

/** AI 助手模型详情（点击模型卡片后展示） */
export interface AssistantModelDetail extends AssistantModelSummary {
  apiBaseUrl: string;
  modelId: string;
  apiKey: string;
  apiKeyConfigured: boolean;
  connectionStatus: string;
  maxOutput: string;
  temperature: string;
}
