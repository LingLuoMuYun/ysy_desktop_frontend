import { Activity, Bot, CheckCircle2, FolderOpen, Info, Pencil, Plus, RotateCw, Save, Star, Trash2, User, X, XCircle, Zap } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { assistantModelDetails, assistantModels } from "../mocks/prototypeData";
import { assistantModelsApi, type AssistantModelFormInput } from "../services/assistantModelsApi";
import { environmentsApi, type EnvironmentCreateInput, type EnvironmentImportInput } from "../services/environmentsApi";
import type { AssistantModelDetail, RuntimeEnvironmentSummary } from "../types/domain";

type SettingsTab = "environment" | "assistant" | "profile";
type EnvironmentCreateMode = "system" | "import" | "custom";
type EnvironmentDeleteScope = "database" | "local-and-database";

const SYSTEM_TEMPLATE_GROUPS = [
  { key: "dl", title: "深度学习", items: ["目标检测", "图像分类", "语义检测"] },
  { key: "llm-train", title: "大模型训练", items: ["LLM", "Embedding", "Rerank"] },
  { key: "llm-infer", title: "大模型推理", items: ["LLM", "Embedding", "Rerank"] },
] as const;

const SUPPORTED_SYSTEM_TEMPLATE = "llm-infer:LLM";

function normalizeLocalPath(value: string) {
  return value.trim().replace(/\\/g, "/");
}

function isAbsoluteLocalPath(value: string) {
  const normalized = normalizeLocalPath(value);
  return normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized);
}

const tabs: Array<{ key: SettingsTab; label: string }> = [
  { key: "environment", label: "环境" },
  { key: "assistant", label: "AI助手" },
  { key: "profile", label: "个人信息" },
];

/** 对 API Key 做隐私保护：仅展示 sk- 前缀和末尾 5 个字符，中间用 •••• 替代 */
function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return key || "未配置";
  if (key.startsWith("sk-")) {
    return `sk-••••${key.slice(-5)}`;
  }
  return `${key.slice(0, 3)}••••${key.slice(-5)}`;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("environment");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [envList, setEnvList] = useState<RuntimeEnvironmentSummary[]>([]);
  const [modelList, setModelList] = useState(assistantModels);
  const [modelDetails, setModelDetails] = useState(assistantModelDetails);
  const [deleteTarget, setDeleteTarget] = useState<RuntimeEnvironmentSummary | null>(null);
  const [modelDeleteTarget, setModelDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isCreateEnvironmentOpen, setIsCreateEnvironmentOpen] = useState(false);
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null);
  const [isEnvironmentLoading, setIsEnvironmentLoading] = useState(false);
  const [checkingEnvironmentIds, setCheckingEnvironmentIds] = useState<Set<string>>(new Set());
  const [isModelLoading, setIsModelLoading] = useState(false);

  // 5 秒后自动消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const setAssistantModels = (models: AssistantModelDetail[]) => {
    setModelList(
      models.map(
        ({
          apiBaseUrl: _apiBaseUrl,
          modelId: _modelId,
          apiKey: _apiKey,
          apiKeyConfigured: _apiKeyConfigured,
          connectionStatus: _connectionStatus,
          maxOutput: _maxOutput,
          temperature: _temperature,
          ...summary
        }) => summary,
      ),
    );
    setModelDetails(Object.fromEntries(models.map((model) => [model.id, model])) as Record<string, AssistantModelDetail>);
  };

  const showError = (message: string) => {
    setToast({ message, tone: "danger" });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadEnvironments() {
      setIsEnvironmentLoading(true);
      try {
        const { environments, omittedCount } = await environmentsApi.list();
        if (!cancelled) {
          setEnvList(environments);
          if (omittedCount > 0) {
            showError(`已加载 ${environments.length} 个环境，另有 ${omittedCount} 条后端异常记录暂时无法显示`);
          }
        }
      } catch (error) {
        if (!cancelled) {
          showError(error instanceof Error ? error.message : "环境列表加载失败");
        }
      } finally {
        if (!cancelled) {
          setIsEnvironmentLoading(false);
        }
      }
    }

    loadEnvironments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAssistantModels() {
      setIsModelLoading(true);
      try {
        const models = await assistantModelsApi.list();
        if (!cancelled) {
          setAssistantModels(models);
          setSelectedModelId((current) => (current && models.some((model) => model.id === current) ? current : null));
        }
      } catch (error) {
        if (!cancelled) {
          showError(error instanceof Error ? error.message : "AI 助手模型列表加载失败");
        }
      } finally {
        if (!cancelled) {
          setIsModelLoading(false);
        }
      }
    }

    loadAssistantModels();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteConfirm = async (scope: EnvironmentDeleteScope) => {
    if (!deleteTarget) return;
    try {
      await environmentsApi.delete(deleteTarget.id, {
        deleteLocalFiles: scope === "local-and-database",
        deleteLocalFilesConfirmed: scope === "local-and-database",
      });
      setEnvList((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setToast({ message: `${deleteTarget.name} 已删除`, tone: "success" });
      setDeleteTarget(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "环境删除失败");
      setDeleteTarget(null);
    }
  };

  const handleDetectEnvironment = async (environment: RuntimeEnvironmentSummary) => {
    setToast({ message: `${environment.name}：当前后端暂未开放环境检测接口`, tone: "danger" });
  };

  const handleModelDeleteConfirm = () => {
    if (!modelDeleteTarget) return;
    assistantModelsApi
      .delete(modelDeleteTarget.id)
      .then(() => {
        setModelList((prev) => prev.filter((m) => m.id !== modelDeleteTarget.id));
        setModelDetails((prev) => {
          const next = { ...prev };
          delete next[modelDeleteTarget.id];
          return next;
        });
        if (selectedModelId === modelDeleteTarget.id) {
          setSelectedModelId(null);
        }
        setModelDeleteTarget(null);
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "模型删除失败");
        setModelDeleteTarget(null);
      });
  };

  return (
    <section className="settings-page">
      <header className="settings-topbar">
        <div className="settings-topbar__left">
          <div className="settings-tabs">
            {tabs.map((tab) => (
              <button
                className={activeTab === tab.key ? "is-active" : ""}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {activeTab !== "profile" ? (
          <div className="settings-topbar__right">
            <button
              className="settings-action-button settings-action-button--primary"
              onClick={() => {
                if (activeTab === "environment") {
                  setIsCreateEnvironmentOpen(true);
                } else if (activeTab === "assistant") {
                  setIsAddModelOpen(true);
                }
              }}
              type="button"
            >
              <Plus size={15} />
              {activeTab === "assistant" ? "添加模型" : "创建环境"}
            </button>
          </div>
        ) : null}
      </header>

      <div className="settings-content">
        {toast ? (
          <div className={`settings-toast${toast.tone === "success" ? " settings-toast--success" : ""}`}>
            <div className="settings-toast__content">
              {toast.tone === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              <span>{toast.message}</span>
            </div>
            <button
              className="settings-toast__close"
              onClick={() => setToast(null)}
              type="button"
              title="关闭"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        <div className="settings-main">
          {activeTab === "environment" ? (
            <EnvironmentSettings
              environments={envList}
              isLoading={isEnvironmentLoading}
              checkingEnvironmentIds={checkingEnvironmentIds}
              onDelete={setDeleteTarget}
              onDetect={handleDetectEnvironment}
            />
          ) : null}
          {activeTab === "assistant" ? (
            <AssistantModelSettings
              models={modelList}
              modelDetails={modelDetails}
              isLoading={isModelLoading}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              onBack={() => setSelectedModelId(null)}
              onSetDefault={async (modelId) => {
                try {
                  const defaultModel = await assistantModelsApi.setDefault(modelId);
                  setModelList((prev) =>
                    prev.map((model) =>
                      model.id === modelId
                        ? {
                            id: defaultModel.id,
                            name: defaultModel.name,
                            status: defaultModel.status,
                            tone: defaultModel.tone,
                            provider: defaultModel.provider,
                            context: defaultModel.context,
                            isDefault: true,
                            variant: defaultModel.variant,
                          }
                        : { ...model, isDefault: false },
                    ),
                  );
                  setModelDetails((prev) =>
                    Object.fromEntries(
                      Object.entries(prev).map(([id, detail]) => [
                        id,
                        id === modelId ? defaultModel : { ...detail, isDefault: false },
                      ]),
                    ) as typeof assistantModelDetails,
                  );
                } catch (error) {
                  showError(error instanceof Error ? error.message : "设置默认模型失败");
                }
              }}
              onUpdateModel={async (input) => {
                try {
                  const updated = await assistantModelsApi.update(input.id, input);
                  setModelList((prev) =>
                    prev.map((model) =>
                      model.id === updated.id
                        ? {
                            ...model,
                            name: updated.name,
                            provider: updated.provider,
                            context: updated.context,
                            status: updated.status,
                            tone: updated.tone,
                            isDefault: updated.isDefault,
                          }
                        : model,
                    ),
                  );
                  setModelDetails((prev) => ({ ...prev, [updated.id]: updated }));
                } catch (error) {
                  showError(error instanceof Error ? error.message : "模型保存失败");
                }
              }}
              onDeleteModel={(id, name) => setModelDeleteTarget({ id, name })}
              onTestModel={async (modelId, modelName) => {
                try {
                  const result = await assistantModelsApi.test(modelId);
                  const isAvailable = result.status === "available";
                  setModelList((prev) =>
                    prev.map((model) =>
                      model.id === modelId
                        ? { ...model, status: isAvailable ? "可用" : "异常", tone: isAvailable ? "success" : "danger" }
                        : model,
                    ),
                  );
                  setModelDetails((prev) => {
                    const detail = prev[modelId];
                    if (!detail) return prev;
                    return {
                      ...prev,
                      [modelId]: {
                        ...detail,
                        status: isAvailable ? "可用" : "异常",
                        tone: isAvailable ? "success" : "danger",
                        connectionStatus: result.message,
                      },
                    };
                  });
                  setToast({
                    message: isAvailable
                      ? `${modelName}：连接测试通过`
                      : `${modelName}：${result.message}`,
                    tone: isAvailable ? "success" : "danger",
                  });
                } catch (error) {
                  showError(error instanceof Error ? error.message : "模型连接测试失败");
                }
              }}
              isAddModelOpen={isAddModelOpen}
              onCloseAddModel={() => setIsAddModelOpen(false)}
              onAddModel={async (input) => {
                try {
                  const newModel = await assistantModelsApi.create(input);
                  setModelList((prev) => [
                    ...prev,
                    {
                      id: newModel.id,
                      name: newModel.name,
                      status: newModel.status,
                      tone: newModel.tone,
                      provider: newModel.provider,
                      context: newModel.context,
                      isDefault: newModel.isDefault,
                      variant: newModel.variant,
                    },
                  ]);
                  setModelDetails((prev) => ({ ...prev, [newModel.id]: newModel }));
                  setIsAddModelOpen(false);
                } catch (error) {
                  showError(error instanceof Error ? error.message : "模型添加失败");
                }
              }}
            />
          ) : null}
          {activeTab === "profile" ? <ProfileSettings /> : null}
        </div>
      </div>

      {deleteTarget && (
        <EnvironmentDeleteDialog
          environment={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {modelDeleteTarget && (
        <ConfirmDialog
          envName={modelDeleteTarget.name}
          onCancel={() => setModelDeleteTarget(null)}
          onConfirm={handleModelDeleteConfirm}
          title="确认删除模型"
          resourceType="模型"
        />
      )}

      {isCreateEnvironmentOpen ? (
        <CreateEnvironmentDialog
          onClose={() => setIsCreateEnvironmentOpen(false)}
          onCreate={async (input) => {
            const newEnv = input.kind === "import"
              ? await environmentsApi.importLocal(input.payload)
              : await environmentsApi.create(input.payload);
            setEnvList((prev) => [newEnv, ...prev]);
            return newEnv;
          }}
        />
      ) : null}
    </section>
  );
}

const ENV_PURPOSE_OPTIONS = ["训练", "部署服务", "LLM 微调", "Embedding 微调", "Rerank 微调", "大模型推理"];
const ENV_TYPE_OPTIONS = ["conda", "venv", "python"];
const ENV_MANAGER_OPTIONS = ["conda+pip", "uv", "pip", "mamba"];

type CreateEnvironmentSubmission =
  | { kind: "create"; payload: EnvironmentCreateInput }
  | { kind: "import"; payload: EnvironmentImportInput };

interface CreateEnvironmentDialogProps {
  onClose: () => void;
  onCreate: (input: CreateEnvironmentSubmission) => Promise<RuntimeEnvironmentSummary>;
}

function CreateEnvironmentDialog({ onClose, onCreate }: CreateEnvironmentDialogProps) {
  const [mode, setMode] = useState<EnvironmentCreateMode>("system");

  // ---- shared form state ----
  const [envName, setEnvName] = useState("PyTorch 通用训练环境");
  const [envPurpose, setEnvPurpose] = useState("训练");
  const [envType, setEnvType] = useState("conda");
  const [envManager, setEnvManager] = useState("conda+pip");
  const [pythonVersion, setPythonVersion] = useState("3.10");
  const [envPath, setEnvPath] = useState("D:/envs/pytorch-general");
  const [pythonInterpreterPath, setPythonInterpreterPath] = useState("D:/envs/pytorch-general/python.exe");
  const [condaEnvName, setCondaEnvName] = useState("pytorch-general");
  const [packageSource, setPackageSource] = useState("https://pypi.tuna.tsinghua.edu.cn/simple");
  const [projectDir, setProjectDir] = useState("D:/workspace/defect-detection");
  const [dependencyFile, setDependencyFile] = useState("D:/workspace/defect-detection/requirements.txt");
  const [autoDetect, setAutoDetect] = useState(true);

  // ---- template selection (system mode) ----
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set(["dl:目标检测"]));

  // ---- confirmation & success flow ----
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTabs: Array<{ key: EnvironmentCreateMode; label: string }> = [
    { key: "system", label: "创建系统环境" },
    { key: "import", label: "导入本地环境" },
    { key: "custom", label: "自定义环境" },
  ];

  const actionLabel =
    mode === "system" ? "创建环境" : mode === "import" ? "导入环境" : "创建环境";

  const handleAction = () => {
    setSubmitError(null);
    if (
      mode === "system"
      && (selectedTemplates.size !== 1 || !selectedTemplates.has(SUPPORTED_SYSTEM_TEMPLATE))
    ) {
      setSubmitError("当前后端仅支持“大模型推理 / LLM”系统模板。其他模板请通过“自定义环境”创建。");
      return;
    }

    const pathsToValidate = mode === "import"
      ? [
          ["本地环境路径", envPath],
          ["Python 解释器路径", pythonInterpreterPath],
        ]
      : mode === "custom"
        ? [
            ["环境保存路径", envPath],
            ["项目目录", projectDir],
            ["依赖文件", dependencyFile],
          ]
        : [];
    const invalidPath = pathsToValidate.find(([, value]) => !isAbsoluteLocalPath(value));
    if (invalidPath) {
      setSubmitError(`${invalidPath[0]}必须填写绝对路径`);
      return;
    }
    setShowConfirm(true);
  };

  const buildCreatePayload = (): CreateEnvironmentSubmission => {
    if (mode === "import") {
      return {
        kind: "import",
        payload: {
          name: envName.trim(),
          purpose: envPurpose,
          environmentPath: envPath.trim(),
          pythonPath: pythonInterpreterPath.trim(),
          environmentManager: envType,
          condaEnvName: envType === "conda" ? condaEnvName.trim() : "",
          autoCheck: autoDetect,
        },
      };
    }

    return {
      kind: "create",
      payload: {
        mode,
        name: envName.trim(),
        purpose: envPurpose,
        template: mode === "system" ? "llm_inference.llm" : dependencyFile.trim() || envManager,
        python: pythonVersion.trim(),
        cuda: "CUDA 12.1",
        savePath: envPath.trim(),
        autoCheck: autoDetect,
        environmentManager: mode === "custom" ? envManager : undefined,
        packageSource: mode === "custom" ? packageSource.trim() : undefined,
        projectDir: mode === "custom" ? projectDir.trim() : undefined,
        dependencyFile: mode === "custom" ? dependencyFile.trim() : undefined,
        category: mode === "system" ? "llm_inference" : undefined,
        taskType: mode === "system" ? "llm" : undefined,
        idempotencyKey: `env-create-${mode}-${Date.now()}`,
      },
    };
  };

  // 成功页 1.2 秒后自动关闭，组件卸载时清理定时器避免闪退
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => {
      onClose();
    }, 1200);
    return () => clearTimeout(timer);
  }, [showSuccess, onClose]);

  const handleConfirm = async () => {
    if (isSubmitting) return; // 防止重复提交
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onCreate(buildCreatePayload());
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "环境创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackFromConfirm = () => {
    setSubmitError(null);
    setShowConfirm(false);
  };

  const handleOverlayClose = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleConfirmOverlayClose = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      handleBackFromConfirm();
    }
  };

  // ---- file/folder picker refs ----
  const envPathInputRef = useRef<HTMLInputElement>(null);
  const interpreterPathInputRef = useRef<HTMLInputElement>(null);
  const dependencyFileInputRef = useRef<HTMLInputElement>(null);
  const projectDirInputRef = useRef<HTMLInputElement>(null);

  const handleFolderPick = async (
    ref: React.RefObject<HTMLInputElement | null>,
    setter: (v: string) => void,
  ) => {
    try {
      if (window.ysyDesktop?.selectDirectory) {
        const selectedPath = await window.ysyDesktop.selectDirectory("选择环境目录");
        if (selectedPath) {
          const normalizedPath = normalizeLocalPath(selectedPath);
          if (!isAbsoluteLocalPath(normalizedPath)) {
            throw new Error("系统选择器未返回绝对目录路径");
          }
          setter(normalizedPath);
          setSubmitError(null);
        }
        return;
      }
      if (window.ysyDesktop?.getFilePath) {
        ref.current?.click();
        return;
      }
      setSubmitError("当前浏览器无法读取目录绝对路径，请手动输入绝对路径或使用桌面端选择目录");
    } catch (error) {
      console.error("[env-create] 目录选择失败:", error);
      setSubmitError(error instanceof Error ? error.message : "目录选择失败");
    }
  };

  const handleFilePick = async (
    ref: React.RefObject<HTMLInputElement | null>,
    setter: (v: string) => void,
  ) => {
    try {
      if (window.ysyDesktop?.selectFile) {
        const selectedPath = await window.ysyDesktop.selectFile("选择环境文件");
        if (selectedPath) {
          const normalizedPath = normalizeLocalPath(selectedPath);
          if (!isAbsoluteLocalPath(normalizedPath)) {
            throw new Error("系统选择器未返回绝对文件路径");
          }
          setter(normalizedPath);
          setSubmitError(null);
        }
        return;
      }
      if (window.ysyDesktop?.getFilePath) {
        ref.current?.click();
        return;
      }
      setSubmitError("当前浏览器无法读取文件绝对路径，请手动输入绝对路径或使用桌面端选择文件");
    } catch (error) {
      console.error("[env-create] 文件选择失败:", error);
      setSubmitError(error instanceof Error ? error.message : "文件选择失败");
    }
  };

  const makeFolderChangeHandler = (setter: (v: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        event.target.value = "";
        return;
      }
      // Electron: 通过 webUtils.getPathForFile 获取绝对路径
      const electronPath: string = window.ysyDesktop?.getFilePath?.(file) || "";
      const relativePath: string = file.webkitRelativePath || "";
      const normalizedFilePath = electronPath.replace(/\\/g, "/");

      if (normalizedFilePath && relativePath && normalizedFilePath.endsWith(relativePath)) {
        // Electron 下完整路径 = electronPath - webkitRelativePath
        const dirPath = normalizedFilePath.slice(0, -relativePath.length).replace(/\/$/, "");
        if (isAbsoluteLocalPath(dirPath)) {
          setter(dirPath);
          setSubmitError(null);
        }
      } else if (isAbsoluteLocalPath(normalizedFilePath)) {
        // Electron 降级：直接使用 getFilePath 返回的路径
        setter(normalizedFilePath);
        setSubmitError(null);
      } else {
        setSubmitError("无法获取目录绝对路径，请手动输入绝对路径或使用桌面端重新选择");
      }
      event.target.value = "";
    };

  const makeFileChangeHandler = (setter: (v: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        event.target.value = "";
        return;
      }
      // Electron: 通过 webUtils.getPathForFile 获取绝对路径
      const electronPath: string = window.ysyDesktop?.getFilePath?.(file) || "";
      const normalizedElectronPath = normalizeLocalPath(electronPath);
      if (isAbsoluteLocalPath(normalizedElectronPath)) {
        setter(normalizedElectronPath);
        setSubmitError(null);
        event.target.value = "";
        return;
      }
      // Electron 旧版 API 降级: File.path 属性
      const legacyPath: string = (file as File & { path?: string }).path || "";
      const normalizedLegacyPath = normalizeLocalPath(legacyPath);
      if (isAbsoluteLocalPath(normalizedLegacyPath)) {
        setter(normalizedLegacyPath);
        setSubmitError(null);
        event.target.value = "";
        return;
      }
      setSubmitError("无法获取文件绝对路径，请手动输入绝对路径或使用桌面端重新选择");
      event.target.value = "";
    };

  const toggleTemplate = (item: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const toggleTemplateGroup = (items: string[]) => {
    setSelectedTemplates((prev) => {
      const allSelected = items.every((i) => prev.has(i));
      const next = new Set(prev);
      if (allSelected) {
        items.forEach((i) => next.delete(i));
      } else {
        items.forEach((i) => next.add(i));
      }
      return next;
    });
  };

  // ---- render ----

  if (showSuccess) {
    return (
      <div className="env-create-overlay" onClick={handleOverlayClose}>
        <section
          aria-modal="true"
          className="env-create-dialog env-create-dialog--success"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
        >
          <div className="env-create-success">
            <CheckCircle2 size={48} className="env-create-success__icon" />
            <h3>{mode === "system" ? "系统环境创建任务已提交" : `${envName} 创建任务已提交`}</h3>
            <p>后台会继续创建环境并更新状态。</p>
          </div>
        </section>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="env-create-overlay" onClick={handleConfirmOverlayClose}>
        <section
          aria-modal="true"
          className="env-create-dialog env-create-dialog--confirm"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
        >
          <header className="env-create-dialog__header">
            <h2 id="env-create-title">确认创建环境</h2>
            <button className="env-create-dialog__close" disabled={isSubmitting} onClick={handleBackFromConfirm} title="返回" type="button">
              <X size={18} />
            </button>
          </header>

          <div className="env-create-dialog__body env-create-confirm-body">
            <p className="confirm-dialog__desc">
              该操作会改变本机任务、服务或配置状态，需确认后继续。
            </p>
            <dl className="confirm-dialog__info">
              <div className="confirm-dialog__row">
                <dt>影响对象</dt>
                <dd>{envName}</dd>
              </div>
              <div className="confirm-dialog__row">
                <dt>是否会修改文件或环境</dt>
                <dd>确认后会按当前权限执行</dd>
              </div>
              <div className="confirm-dialog__row">
                <dt>资源影响</dt>
                <dd>可能创建目录并安装 Python、CUDA 或深度学习依赖</dd>
              </div>
              <div className="confirm-dialog__row">
                <dt>是否可撤销</dt>
                <dd>否</dd>
              </div>
            </dl>
            <p className="confirm-dialog__risk">
              <strong>AI 风险提示：</strong>请确认目标、资源占用和上下文后再继续。
            </p>
            {submitError ? (
              <p className="confirm-dialog__risk confirm-dialog__risk--danger">
                {submitError}
              </p>
            ) : null}
          </div>

          <footer className="env-create-dialog__footer">
            <div />
            <div className="env-create-dialog__actions">
              <button className="settings-action-button" disabled={isSubmitting} onClick={handleBackFromConfirm} type="button">
                返回修改
              </button>
              <button className="settings-action-button settings-action-button--primary" disabled={isSubmitting} onClick={handleConfirm} type="button">
                {isSubmitting ? "提交中..." : mode === "import" ? "确认导入环境" : "确认创建环境"}
              </button>
            </div>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="env-create-overlay" onClick={handleOverlayClose}>
      <section
        aria-labelledby="env-create-title"
        aria-modal="true"
        className="env-create-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <header className="env-create-dialog__header">
          <h2 id="env-create-title">创建环境</h2>
          <button className="env-create-dialog__close" onClick={onClose} title="关闭" type="button">
            <X size={18} />
          </button>
        </header>

        <div className="env-create-dialog__body">
          <nav className="env-create-tabs" aria-label="创建环境方式">
            {createTabs.map((tab) => (
              <button
                className={mode === tab.key ? "is-active" : ""}
                key={tab.key}
                onClick={() => setMode(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {mode === "system" ? (
            <SystemEnvironmentPane
              selectedTemplates={selectedTemplates}
              onToggleTemplate={toggleTemplate}
              onToggleTemplateGroup={toggleTemplateGroup}
            />
          ) : null}
          {submitError ? (
            <p className="env-create-template-notice" role="alert">{submitError}</p>
          ) : null}
          {mode === "import" ? (
            <ImportEnvironmentPane
              envName={envName}
              onEnvNameChange={setEnvName}
              envPurpose={envPurpose}
              onEnvPurposeChange={setEnvPurpose}
              envType={envType}
              onEnvTypeChange={setEnvType}
              envPath={envPath}
              onEnvPathChange={setEnvPath}
              pythonInterpreterPath={pythonInterpreterPath}
              onPythonInterpreterPathChange={setPythonInterpreterPath}
              condaEnvName={condaEnvName}
              onCondaEnvNameChange={setCondaEnvName}
              envPathInputRef={envPathInputRef}
              interpreterPathInputRef={interpreterPathInputRef}
              onFolderPick={handleFolderPick}
              onFilePick={handleFilePick}
              onFolderChange={makeFolderChangeHandler}
              onFileChange={makeFileChangeHandler}
            />
          ) : null}
          {mode === "custom" ? (
            <CustomEnvironmentPane
              envName={envName}
              onEnvNameChange={setEnvName}
              envPurpose={envPurpose}
              onEnvPurposeChange={setEnvPurpose}
              envManager={envManager}
              onEnvManagerChange={setEnvManager}
              pythonVersion={pythonVersion}
              onPythonVersionChange={setPythonVersion}
              envPath={envPath}
              onEnvPathChange={setEnvPath}
              packageSource={packageSource}
              onPackageSourceChange={setPackageSource}
              projectDir={projectDir}
              onProjectDirChange={setProjectDir}
              dependencyFile={dependencyFile}
              onDependencyFileChange={setDependencyFile}
              envPathInputRef={envPathInputRef}
              dependencyFileInputRef={dependencyFileInputRef}
              projectDirInputRef={projectDirInputRef}
              onFolderPick={handleFolderPick}
              onFilePick={handleFilePick}
              onFolderChange={makeFolderChangeHandler}
              onFileChange={makeFileChangeHandler}
            />
          ) : null}
        </div>

        <footer className="env-create-dialog__footer">
          <label className="env-create-auto-check">
            <input
              checked={autoDetect}
              onChange={(e) => setAutoDetect(e.target.checked)}
              type="checkbox"
            />
            <span>
              创建 / 导入后自动检测
              <small>检查 Python、框架、CUDA、驱动、磁盘和依赖文件。</small>
            </span>
          </label>
          <div className="env-create-dialog__actions">
            <button className="settings-action-button" disabled={isSubmitting} onClick={onClose} type="button">
              取消
            </button>
            <button className="settings-action-button settings-action-button--primary" disabled={isSubmitting} onClick={handleAction} type="button">
              {actionLabel}
            </button>
          </div>
        </footer>
      </section>

      {/* hidden file inputs for path selection */}
      <HiddenFolderInput ref={envPathInputRef} onChange={makeFolderChangeHandler(setEnvPath)} />
      <HiddenFileInput ref={interpreterPathInputRef} onChange={makeFileChangeHandler(setPythonInterpreterPath)} />
      <HiddenFileInput ref={dependencyFileInputRef} onChange={makeFileChangeHandler(setDependencyFile)} />
      <HiddenFolderInput ref={projectDirInputRef} onChange={makeFolderChangeHandler(setProjectDir)} />
    </div>
  );
}

/* ---- hidden file/folder inputs (rendered outside dialog so they work) ---- */
const HiddenFolderInput = forwardRef<HTMLInputElement, { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }>(
  ({ onChange }, ref) => (
    <input
      ref={ref}
      className="profile-folder-input"
      onClick={(event) => event.stopPropagation()}
      onChange={onChange}
      type="file"
      // @ts-expect-error webkitdirectory is supported by Chromium/Electron.
      webkitdirectory=""
    />
  ),
);
HiddenFolderInput.displayName = "HiddenFolderInput";

const HiddenFileInput = forwardRef<HTMLInputElement, { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }>(
  ({ onChange }, ref) => (
    <input
      ref={ref}
      className="profile-folder-input"
      onClick={(event) => event.stopPropagation()}
      onChange={onChange}
      type="file"
    />
  ),
);
HiddenFileInput.displayName = "HiddenFileInput";

/* ---- system environment pane ---- */
interface SystemEnvironmentPaneProps {
  selectedTemplates: Set<string>;
  onToggleTemplate: (item: string) => void;
  onToggleTemplateGroup: (items: string[]) => void;
}

function SystemEnvironmentPane({
  selectedTemplates, onToggleTemplate, onToggleTemplateGroup,
}: SystemEnvironmentPaneProps) {
  return (
    <div className="env-create-pane">
      <p className="env-create-description">
        选择预置模板后创建环境。环境名称和 Conda 环境名称将由系统自动生成。
      </p>
      <div className="env-template-grid" aria-label="系统环境模板">
        {SYSTEM_TEMPLATE_GROUPS.map((group) => {
          const itemKeys = group.items.map((item) => `${group.key}:${item}`);
          return (
            <TemplateGroup
              groupKey={group.key}
              items={[...group.items]}
              key={group.key}
              selectedTemplates={selectedTemplates}
              title={group.title}
              onToggle={onToggleTemplate}
              onToggleGroup={() => onToggleTemplateGroup(itemKeys)}
            />
          );
        })}
      </div>
    </div>
  );
}

function TemplateGroup({
  groupKey,
  title,
  items,
  selectedTemplates,
  onToggle,
  onToggleGroup,
}: {
  groupKey: string;
  title: string;
  items: string[];
  selectedTemplates: Set<string>;
  onToggle: (item: string) => void;
  onToggleGroup: (items: string[]) => void;
}) {
  const keys = items.map((item) => `${groupKey}:${item}`);
  const checkedCount = keys.filter((k) => selectedTemplates.has(k)).length;
  const allChecked = checkedCount === items.length;
  const someChecked = checkedCount > 0 && checkedCount < items.length;

  return (
    <article className="env-template-card">
      <button
        className="env-template-card__title"
        onClick={() => onToggleGroup(keys)}
        type="button"
      >
        <CheckboxMark checked={allChecked} mixed={someChecked} />
        <strong>{title}</strong>
      </button>
      <div className="env-template-card__items">
        {items.map((item, i) => (
          <button
            className="env-template-option"
            key={keys[i]}
            onClick={() => onToggle(keys[i])}
            type="button"
          >
            <CheckboxMark checked={selectedTemplates.has(keys[i])} />
            <span>{item}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function CheckboxMark({ checked, mixed = false }: { checked: boolean; mixed?: boolean }) {
  return (
    <span className={`env-create-checkbox${checked ? " is-checked" : ""}${mixed ? " is-mixed" : ""}`}>
      {checked ? "✓" : mixed ? "−" : ""}
    </span>
  );
}

/* ---- import environment pane ---- */
interface ImportEnvironmentPaneProps {
  envName: string;
  onEnvNameChange: (v: string) => void;
  envPurpose: string;
  onEnvPurposeChange: (v: string) => void;
  envType: string;
  onEnvTypeChange: (v: string) => void;
  envPath: string;
  onEnvPathChange: (v: string) => void;
  pythonInterpreterPath: string;
  onPythonInterpreterPathChange: (v: string) => void;
  condaEnvName: string;
  onCondaEnvNameChange: (v: string) => void;
  envPathInputRef: React.RefObject<HTMLInputElement | null>;
  interpreterPathInputRef: React.RefObject<HTMLInputElement | null>;
  onFolderPick: (ref: React.RefObject<HTMLInputElement | null>, setter: (v: string) => void) => void;
  onFilePick: (ref: React.RefObject<HTMLInputElement | null>, setter: (v: string) => void) => void;
  onFolderChange: (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ImportEnvironmentPane({
  envName, onEnvNameChange,
  envPurpose, onEnvPurposeChange,
  envType, onEnvTypeChange,
  envPath, onEnvPathChange,
  pythonInterpreterPath, onPythonInterpreterPathChange,
  condaEnvName, onCondaEnvNameChange,
  envPathInputRef, interpreterPathInputRef,
  onFolderPick, onFilePick,
}: ImportEnvironmentPaneProps) {
  return (
    <div className="env-create-pane">
      <p className="env-create-description">
        导入本地环境只登记路径和依赖信息，不复制或修改已有 Python 环境。
      </p>
      <div className="env-create-form-grid">
        <EnvFormField label="环境名称" value={envName} onChange={onEnvNameChange} />
        <EnvSelectField label="环境用途" value={envPurpose} onChange={onEnvPurposeChange} options={ENV_PURPOSE_OPTIONS} />
        <EnvSelectField label="环境类型" value={envType} onChange={onEnvTypeChange} options={ENV_TYPE_OPTIONS} />
        <EnvPathField label="本地环境路径" value={envPath} onChange={onEnvPathChange} onBrowse={() => onFolderPick(envPathInputRef, onEnvPathChange)} />
        <EnvPathField label="Python 解释器路径" value={pythonInterpreterPath} onChange={onPythonInterpreterPathChange} onBrowse={() => onFilePick(interpreterPathInputRef, onPythonInterpreterPathChange)} />
        <EnvFormField label="Conda 环境名" value={condaEnvName} onChange={onCondaEnvNameChange} />
      </div>
    </div>
  );
}

/* ---- custom environment pane ---- */
interface CustomEnvironmentPaneProps {
  envName: string;
  onEnvNameChange: (v: string) => void;
  envPurpose: string;
  onEnvPurposeChange: (v: string) => void;
  envManager: string;
  onEnvManagerChange: (v: string) => void;
  pythonVersion: string;
  onPythonVersionChange: (v: string) => void;
  envPath: string;
  onEnvPathChange: (v: string) => void;
  packageSource: string;
  onPackageSourceChange: (v: string) => void;
  projectDir: string;
  onProjectDirChange: (v: string) => void;
  dependencyFile: string;
  onDependencyFileChange: (v: string) => void;
  envPathInputRef: React.RefObject<HTMLInputElement | null>;
  dependencyFileInputRef: React.RefObject<HTMLInputElement | null>;
  projectDirInputRef: React.RefObject<HTMLInputElement | null>;
  onFolderPick: (ref: React.RefObject<HTMLInputElement | null>, setter: (v: string) => void) => void;
  onFilePick: (ref: React.RefObject<HTMLInputElement | null>, setter: (v: string) => void) => void;
  onFolderChange: (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CustomEnvironmentPane({
  envName, onEnvNameChange,
  envPurpose, onEnvPurposeChange,
  envManager, onEnvManagerChange,
  pythonVersion, onPythonVersionChange,
  envPath, onEnvPathChange,
  packageSource, onPackageSourceChange,
  projectDir, onProjectDirChange,
  dependencyFile, onDependencyFileChange,
  envPathInputRef, dependencyFileInputRef, projectDirInputRef,
  onFolderPick, onFilePick,
}: CustomEnvironmentPaneProps) {
  return (
    <div className="env-create-pane">
      <p className="env-create-description">
        自定义环境会读取 requirements.txt、environment.yml 或 pyproject.toml，生成环境创建计划。
      </p>
      <div className="env-create-form-grid">
        <EnvFormField label="环境名称" value={envName} onChange={onEnvNameChange} />
        <EnvSelectField label="环境管理器" value={envManager} onChange={onEnvManagerChange} options={ENV_MANAGER_OPTIONS} />
        <EnvSelectField label="环境用途" value={envPurpose} onChange={onEnvPurposeChange} options={ENV_PURPOSE_OPTIONS} />
        <EnvFormField label="Python 版本" value={pythonVersion} onChange={onPythonVersionChange} />
        <EnvPathField label="环境保存路径" value={envPath} onChange={onEnvPathChange} onBrowse={() => onFolderPick(envPathInputRef, onEnvPathChange)} />
        <EnvFormField label="包下载源" value={packageSource} onChange={onPackageSourceChange} />
        <EnvPathField label="项目目录" value={projectDir} onChange={onProjectDirChange} onBrowse={() => onFolderPick(projectDirInputRef, onProjectDirChange)} />
        <EnvPathField label="依赖文件" value={dependencyFile} onChange={onDependencyFileChange} onBrowse={() => onFilePick(dependencyFileInputRef, onDependencyFileChange)} />
      </div>
    </div>
  );
}

/* ---- reusable form field components for create dialog ---- */
function EnvFormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="env-create-field">
      <span>{label}</span>
      <input onChange={(e) => onChange(e.target.value)} title={value} value={value} />
    </label>
  );
}

function EnvSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="env-create-field">
      <span>{label}</span>
      <select
        className="env-create-select"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function EnvPathField({
  label,
  value,
  onChange,
  onBrowse,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBrowse: () => void;
}) {
  return (
    <div className="env-create-field">
      <span>{label}</span>
      <div className="env-create-path-control">
        <input aria-label={label} onChange={(e) => onChange(e.target.value)} title={value} value={value} />
        <button onClick={onBrowse} title="选择路径" type="button">
          <FolderOpen size={15} />
        </button>
      </div>
    </div>
  );
}

function EnvironmentSettings({
  environments,
  isLoading,
  checkingEnvironmentIds,
  onDelete,
  onDetect,
}: {
  environments: RuntimeEnvironmentSummary[];
  isLoading: boolean;
  checkingEnvironmentIds: Set<string>;
  onDelete: (environment: RuntimeEnvironmentSummary) => void;
  onDetect: (environment: RuntimeEnvironmentSummary) => void;
}) {
  if (isLoading) {
    return (
      <div className="settings-empty">
        <p>正在加载运行环境...</p>
      </div>
    );
  }

  if (environments.length === 0) {
    return (
      <div className="settings-empty">
        <p>暂无运行环境，请创建或导入环境。</p>
      </div>
    );
  }

  return (
    <div className="environment-list" aria-label="运行环境列表">
      {environments.map((env) => {
        const isChecking = checkingEnvironmentIds.has(env.id);
        return (
          <article
            className="environment-card"
            key={env.id}
          >
            <div className="environment-card__icon" aria-hidden="true">
              <span />
            </div>
            <div className="environment-card__body">
              <div className="environment-card__heading">
                <h2>{env.name}</h2>
                <StatusBadge label={env.status} tone={env.tone} />
              </div>
              <div className="environment-card__identity">
                <p>{env.purpose}</p>
              </div>
              <div className="environment-card__runtime" aria-label={`${env.name} 运行配置`}>
                <div>
                  <strong title={env.python}>{env.python}</strong>
                </div>
                <div>
                  <strong title={env.framework}>{env.framework}</strong>
                </div>
                <div>
                  <strong title={env.cuda}>{env.cuda}</strong>
                </div>
              </div>
            </div>
            <div className="environment-card__side">
              <time>{env.updatedAt}</time>
              <div className="environment-card__actions">
                <button
                  aria-label={isChecking ? "环境检测中" : `检测 ${env.name}`}
                  className="environment-card__icon-action"
                  title={isChecking ? "环境检测中" : "检测环境"}
                  type="button"
                  disabled={isChecking}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetect(env);
                  }}
                >
                  <RotateCw size={13} />
                  {isChecking ? "检测中" : "检测环境"}
                </button>
                <button
                  aria-label={`删除 ${env.name}`}
                  className="environment-card__icon-action environment-card__danger"
                  title="删除环境"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(env);
                  }}
                >
                  <Trash2 size={13} />
                  删除
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AssistantModelSettings({
  models,
  modelDetails,
  isLoading,
  selectedModelId,
  onSelectModel,
  onBack,
  onSetDefault,
  onUpdateModel,
  onDeleteModel,
  onTestModel,
  isAddModelOpen,
  onCloseAddModel,
  onAddModel,
}: {
  models: typeof assistantModels;
  modelDetails: typeof assistantModelDetails;
  isLoading: boolean;
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  onBack: () => void;
  onSetDefault: (id: string) => void;
  onUpdateModel: (model: AssistantModelFormInput & { id: string }) => void;
  onDeleteModel: (id: string, name: string) => void;
  onTestModel: (modelId: string, modelName: string) => void;
  isAddModelOpen: boolean;
  onCloseAddModel: () => void;
  onAddModel: (model: AssistantModelFormInput) => void;
}) {
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const selectedDetail: AssistantModelDetail | null =
    selectedModelId && modelDetails[selectedModelId]
      ? modelDetails[selectedModelId]
      : null;

  return (
    <section className="model-management">
      <div className="settings-section-heading">
        <h2>模型管理</h2>
        <p>管理模型来源、连接检测、默认模型和适用场景。</p>
      </div>
      {isLoading ? (
        <div className="settings-empty">
          <p>正在加载 AI 助手模型...</p>
        </div>
      ) : null}
      {!isLoading && models.length === 0 ? (
        <div className="settings-empty">
          <p>暂无模型配置，请添加模型。</p>
        </div>
      ) : null}
      <div className="assistant-model-grid" aria-label="AI 助手模型列表">
        {models.map((model) => (
          <article
            className={`assistant-model-card${
              model.isDefault ? " assistant-model-card--selected" : ""
            }`}
            key={model.id}
            onClick={() => onSelectModel(model.id)}
          >
            <div className="assistant-model-card__header">
              <div className={`assistant-model-card__icon assistant-model-card__icon--${model.variant}`}>
                <Bot size={20} />
              </div>
              <div className="assistant-model-card__badges">
                <StatusBadge label={model.status} tone={model.tone} />
                {model.isDefault ? <span className="default-pill">默认</span> : null}
              </div>
            </div>
            <div className="assistant-model-card__body">
              <h3>{model.name}</h3>
              <div className="model-meta-row">
                <span className="model-provider">{model.provider}</span>
                <span className="model-context">{model.context}</span>
              </div>
            </div>
            <div className="model-card-actions">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTestModel(model.id, model.name);
                }}
              >
                检测模型
              </button>
              <button
                className={model.isDefault ? "is-current-default" : ""}
                disabled={model.isDefault}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(model.id);
                }}
              >
                <Star size={15} />
                {model.isDefault ? "默认模型" : "设为默认"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingModelId(model.id);
                }}
              >
                <Pencil size={14} />
                编辑
              </button>
              <button
                className="model-icon-action"
                type="button"
                title="删除"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteModel(model.id, model.name);
                }}
              >
                <X size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* 模型详情弹窗 */}
      {selectedDetail ? (
        <ModelDetail
          detail={selectedDetail}
          onBack={onBack}
          onEdit={() => setEditingModelId(selectedDetail.id)}
          onDelete={() => onDeleteModel(selectedDetail.id, selectedDetail.name)}
          onTest={() => {
            onBack();
            onTestModel(selectedDetail.id, selectedDetail.name);
          }}
        />
      ) : null}

      {/* 编辑弹窗 */}
      {editingModelId && modelDetails[editingModelId] ? (
        <ModelEditDialog
          detail={modelDetails[editingModelId]}
          onClose={() => setEditingModelId(null)}
          onSave={(updated) => {
            onUpdateModel(updated);
            setEditingModelId(null);
          }}
          onTest={() => {
            setEditingModelId(null);
            onTestModel(modelDetails[editingModelId].id, modelDetails[editingModelId].name);
          }}
        />
      ) : null}

      {/* 添加模型弹窗 */}
      {isAddModelOpen ? (
        <ModelAddDialog
          onClose={onCloseAddModel}
          onSave={onAddModel}
        />
      ) : null}
    </section>
  );
}

/** 添加模型弹窗 */
function ModelAddDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (model: AssistantModelFormInput) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    vendor: "",
    apiBaseUrl: "https://api.deepseek.com/v1",
    modelId: "",
    apiKey: "",
    contextLength: "128K",
    maxOutput: "8,192",
    temperature: "0.6",
  });

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) return;

    const vendor = form.vendor.trim() || "自定义";
    const contextValue = form.contextLength.trim();

    onSave({
      name,
      vendor,
      contextLength: contextValue || "128K",
      apiBaseUrl: form.apiBaseUrl.trim(),
      modelId: form.modelId.trim(),
      apiKey: form.apiKey.trim(),
      maxOutput: form.maxOutput.trim() || "8,192",
      temperature: form.temperature.trim() || "0.6",
    });
  };

  return (
    <div className="model-edit-overlay" onClick={onClose}>
      <section
        aria-labelledby="model-add-title"
        aria-modal="true"
        className="model-edit-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <header className="model-edit-dialog__header">
          <h2 id="model-add-title">添加模型</h2>
          <button className="model-edit-dialog__close" onClick={onClose} title="关闭" type="button">
            <X size={18} />
          </button>
        </header>

        <div className="model-edit-dialog__content">
          <section className="model-edit-section">
            <h3>
              <Info size={15} />
              模型信息
            </h3>
            <div className="model-edit-grid">
              <ModelEditField label="模型名称" value={form.name} onChange={(value) => updateForm("name", value)} />
              <ModelEditField label="模型厂商" value={form.vendor} onChange={(value) => updateForm("vendor", value)} placeholder="例如：DeepSeek、阿里云百炼" />
              <ModelEditField className="model-edit-field--full" label="API Base URL" value={form.apiBaseUrl} onChange={(value) => updateForm("apiBaseUrl", value)} />
              <ModelEditField label="Model ID" value={form.modelId} onChange={(value) => updateForm("modelId", value)} placeholder="例如：deepseek-v4-flash" />
              <ModelEditField label="API Key" type="password" value={form.apiKey} onChange={(value) => updateForm("apiKey", value)} />
            </div>
          </section>

          <section className="model-edit-section">
            <h3>
              <Zap size={15} />
              生成参数
            </h3>
            <div className="model-edit-grid">
              <ModelEditField label="上下文长度" value={form.contextLength} onChange={(value) => updateForm("contextLength", value)} placeholder="例如：128K、1M 或 131072" />
              <ModelEditField label="最大输出长度" value={form.maxOutput} onChange={(value) => updateForm("maxOutput", value)} placeholder="例如：8,192" />
              <ModelEditField label="Temperature" value={form.temperature} onChange={(value) => updateForm("temperature", value)} />
            </div>
          </section>
        </div>

        <footer className="model-edit-dialog__footer">
          <div />
          <div className="model-edit-dialog__actions">
            <button className="settings-action-button" onClick={onClose} type="button">
              取消
            </button>
            <button className="settings-action-button settings-action-button--primary" onClick={handleSave} type="button">
              <Save size={15} />
              保存
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

/** AI 助手模型详情弹窗 */
function ModelDetail({
  detail,
  onBack,
  onEdit,
  onDelete,
  onTest,
}: {
  detail: AssistantModelDetail;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  return (
    <div className="model-edit-overlay" onClick={onBack}>
      <section
        aria-labelledby="model-detail-title"
        aria-modal="true"
        className="model-edit-dialog model-detail-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <header className="model-edit-dialog__header">
          <h2 id="model-detail-title">模型详情</h2>
          <button className="model-edit-dialog__close" onClick={onBack} title="关闭" type="button">
            <X size={18} />
          </button>
        </header>

        <div className="model-edit-dialog__content">
          {/* 模型摘要 */}
          <div className="model-edit-summary">
            <div className={`model-edit-summary__icon assistant-model-card__icon--${detail.variant}`}>
              <Bot size={20} />
            </div>
            <div className="model-edit-summary__text">
              <div className="model-edit-summary__title-row">
                <h3>{detail.name}</h3>
                <StatusBadge label={detail.status} tone={detail.tone} />
                {detail.isDefault ? <span className="default-pill">默认</span> : null}
              </div>
              <p>{detail.provider}</p>
            </div>
          </div>

          {/* 链接信息 */}
          <section className="model-edit-section">
            <h3>
              <Info size={15} />
              链接信息
            </h3>
            <div className="model-edit-grid">
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">模型名称</span>
                <span className="model-detail-info-value">{detail.name}</span>
              </div>
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">模型厂商</span>
                <span className="model-detail-info-value">{detail.provider}</span>
              </div>
              <div className="model-detail-info-item model-detail-info-item--full">
                <span className="model-detail-info-label">API Base URL</span>
                <span className="model-detail-info-value model-detail-info-value--mono">{detail.apiBaseUrl}</span>
              </div>
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">模型标识</span>
                <span className="model-detail-info-value model-detail-info-value--mono">{detail.modelId}</span>
              </div>
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">API Key</span>
                {detail.apiKeyConfigured ? (
                  <span className="model-detail-info-value model-detail-info-value--mono model-detail-api-key">
                    {maskApiKey(detail.apiKey)}
                  </span>
                ) : (
                  <span className="model-detail-info-value model-detail-info-value--warning">未配置</span>
                )}
              </div>
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">连接状态</span>
                <span className={`model-detail-info-value model-detail-info-value--${detail.tone}`}>
                  <span className={`model-detail-status-dot model-detail-status-dot--${detail.tone}`} />
                  {detail.connectionStatus}
                </span>
              </div>
            </div>
          </section>

          {/* 生成参数 */}
          <section className="model-edit-section">
            <h3>
              <Zap size={15} />
              生成参数
            </h3>
            <div className="model-edit-grid">
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">上下文长度</span>
                <span className="model-detail-info-value">{detail.context}</span>
              </div>
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">最大输出长度</span>
                <span className="model-detail-info-value">{detail.maxOutput}</span>
              </div>
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">Temperature</span>
                <span className="model-detail-info-value">{detail.temperature}</span>
              </div>
              <div className="model-detail-info-item">
                <span className="model-detail-info-label">默认模型</span>
                <span className={`model-detail-bool-pill${detail.isDefault ? " model-detail-bool-pill--true" : ""}`}>
                  {detail.isDefault ? "是" : "否"}
                </span>
              </div>
            </div>
          </section>
        </div>

        <footer className="model-edit-dialog__footer">
          <button className="settings-action-button" onClick={onTest} type="button">
            <Activity size={15} />
            连接测试
          </button>
          <div className="model-edit-dialog__actions">
            <button className="settings-action-button settings-action-button--danger" onClick={onDelete} type="button">
              <Trash2 size={15} />
              删除
            </button>
            <button className="settings-action-button" onClick={onEdit} type="button">
              <Pencil size={15} />
              编辑
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ModelEditDialog({
  detail,
  onClose,
  onSave,
  onTest,
}: {
  detail: AssistantModelDetail;
  onClose: () => void;
  onSave: (model: AssistantModelFormInput & { id: string }) => void;
  onTest: () => void;
}) {
  const [form, setForm] = useState({
    name: detail.name,
    vendor: detail.provider,
    apiBaseUrl: detail.apiBaseUrl,
    modelId: detail.modelId,
    apiKey: "",
    contextLength: detail.context.replace(/^上下文\s*/, ""),
    maxOutput: detail.maxOutput.replace(/,/g, ""),
    temperature: detail.temperature,
  });

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    const contextValue = form.contextLength.trim();
    onSave({
      id: detail.id,
      name: form.name.trim() || detail.name,
      vendor: form.vendor.trim() || detail.provider,
      apiBaseUrl: form.apiBaseUrl.trim(),
      modelId: form.modelId.trim(),
      apiKey: form.apiKey,
      contextLength: contextValue || "128K",
      maxOutput: form.maxOutput.trim() || detail.maxOutput,
      temperature: form.temperature.trim() || detail.temperature,
    });
  };

  return (
    <div className="model-edit-overlay" onClick={onClose}>
      <section
        aria-labelledby="model-edit-title"
        aria-modal="true"
        className="model-edit-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <header className="model-edit-dialog__header">
          <h2 id="model-edit-title">模型编辑</h2>
          <button className="model-edit-dialog__close" onClick={onClose} title="关闭" type="button">
            <X size={18} />
          </button>
        </header>

        <div className="model-edit-dialog__content">
          <div className="model-edit-summary">
            <div className={`model-edit-summary__icon assistant-model-card__icon--${detail.variant}`}>
              <Bot size={20} />
            </div>
            <div className="model-edit-summary__text">
              <div className="model-edit-summary__title-row">
                <h3>{form.name || detail.name}</h3>
                <StatusBadge label={detail.status} tone={detail.tone} />
              </div>
              <p>{form.vendor || detail.provider}</p>
            </div>
          </div>

          <section className="model-edit-section">
            <h3>
              <Info size={15} />
              模型信息
            </h3>
            <div className="model-edit-grid">
              <ModelEditField label="模型名称" value={form.name} onChange={(value) => updateForm("name", value)} />
              <ModelEditField label="模型厂商" value={form.vendor} onChange={(value) => updateForm("vendor", value)} placeholder="例如：DeepSeek、阿里云百炼" />
              <ModelEditField className="model-edit-field--full" label="API Base URL" value={form.apiBaseUrl} onChange={(value) => updateForm("apiBaseUrl", value)} />
              <ModelEditField label="Model ID" value={form.modelId} onChange={(value) => updateForm("modelId", value)} placeholder="例如：deepseek-v4-flash" />
              <ModelEditField label="API Key" type="password" value={form.apiKey} onChange={(value) => updateForm("apiKey", value)} />
            </div>
          </section>

          <section className="model-edit-section">
            <h3>
              <Zap size={15} />
              生成参数
            </h3>
            <div className="model-edit-grid">
              <ModelEditField label="上下文长度" value={form.contextLength} onChange={(value) => updateForm("contextLength", value)} placeholder="例如：128K、1M 或 131072" />
              <ModelEditField label="最大输出长度" value={form.maxOutput} onChange={(value) => updateForm("maxOutput", value)} placeholder="例如：8,192" />
              <ModelEditField label="Temperature" value={form.temperature} onChange={(value) => updateForm("temperature", value)} />
            </div>
          </section>
        </div>

        <footer className="model-edit-dialog__footer">
          <button className="settings-action-button" onClick={onTest} type="button">
            <Activity size={15} />
            连接测试
          </button>
          <div className="model-edit-dialog__actions">
            <button className="settings-action-button" onClick={onClose} type="button">
              取消
            </button>
            <button className="settings-action-button settings-action-button--primary" onClick={handleSave} type="button">
              <Save size={15} />
              保存
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ModelEditField({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "password" | "text";
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`model-edit-field${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      <input onChange={(e) => onChange(e.target.value)} title={value} type={type} value={value} placeholder={placeholder} />
    </label>
  );
}

function getEnvironmentSource(environment: RuntimeEnvironmentSummary) {
  if (environment.environmentSource) {
    return environment.environmentSource;
  }

  const source = `${environment.id} ${environment.name} ${environment.purpose} ${environment.framework}`.toLowerCase();
  if (source.includes("import") || source.includes("embedding") || source.includes("rerank")) {
    return "导入本地环境";
  }
  if (source.includes("custom") || source.includes("qlora") || source.includes("peft")) {
    return "自定义环境";
  }
  return "创建系统环境";
}

function EnvironmentDeleteDialog({
  environment,
  onCancel,
  onConfirm,
}: {
  environment: RuntimeEnvironmentSummary;
  onCancel: () => void;
  onConfirm: (scope: EnvironmentDeleteScope) => void;
}) {
  const environmentSource = getEnvironmentSource(environment);
  const [deleteScope, setDeleteScope] = useState<EnvironmentDeleteScope>("database");
  const [showLocalConfirm, setShowLocalConfirm] = useState(false);

  const handlePrimaryConfirm = () => {
    if (deleteScope === "local-and-database") {
      setShowLocalConfirm(true);
      return;
    }
    onConfirm(deleteScope);
  };

  if (showLocalConfirm) {
    return (
      <div className="confirm-overlay" onClick={onCancel}>
        <div className="confirm-dialog confirm-dialog--environment confirm-dialog--local-delete" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-dialog__header confirm-dialog__header--plain">
            <h2>确认删除本地环境</h2>
            <button className="confirm-dialog__close" onClick={onCancel} title="关闭" type="button">
              <X size={18} />
            </button>
          </div>

          <div className="confirm-dialog__content">
            <p className="confirm-dialog__desc">
              该操作会删除本地环境，请再次确认。
            </p>
            <p className="confirm-dialog__local-target">本地环境：{environment.name}</p>
          </div>

          <div className="confirm-dialog__actions confirm-dialog__actions--footer">
            <button className="settings-action-button" type="button" onClick={() => setShowLocalConfirm(false)}>
              返回
            </button>
            <button
              className="settings-action-button settings-action-button--danger"
              type="button"
              onClick={() => onConfirm("local-and-database")}
            >
              确认删除本地环境
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog confirm-dialog--environment" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header confirm-dialog__header--plain">
          <h2>确认删除环境</h2>
          <button className="confirm-dialog__close" onClick={onCancel} title="关闭" type="button">
            <X size={18} />
          </button>
        </div>

        <div className="confirm-dialog__content">
          <p className="confirm-dialog__desc">
            该操作会改变本机任务、服务或配置状态，需确认后继续。
          </p>

          <ul className="confirm-dialog__bullets">
            <li>影响对象：{environment.name}</li>
            <li>环境来源：{environmentSource}</li>
            <li>是否会修改文件或环境：按下方删除范围执行</li>
            <li>资源影响：会清理项目和任务中的环境引用。</li>
            <li>是否可撤销：是</li>
            <li>AI 风险提示：请确认目标、资源占用和上下文后再继续。</li>
          </ul>

          <div className="confirm-delete-options" aria-label="删除范围">
            <button
              className={`confirm-delete-option${deleteScope === "database" ? " is-selected" : ""}`}
              onClick={() => setDeleteScope("database")}
              type="button"
            >
              <span className="confirm-delete-option__radio" aria-hidden="true" />
              <span>
                <strong>删除数据库环境</strong>
                <small>仅移除环境记录和业务引用，不删除本地环境目录。</small>
              </span>
            </button>
            <button
              className={`confirm-delete-option${deleteScope === "local-and-database" ? " is-selected" : ""}`}
              onClick={() => setDeleteScope("local-and-database")}
              type="button"
            >
              <span className="confirm-delete-option__radio" aria-hidden="true" />
              <span>
                <strong>删除本地以及数据库环境</strong>
                <small>
                  {environment.canDeleteLocalFiles
                    ? (environment.deleteLocalFilesReason || "会同时删除本地环境目录和数据库登记记录；确认时会再次提醒。")
                    : (environment.deleteLocalFilesReason || "当前环境可能不支持删除本地文件，后端将进行最终校验；确认时会再次提醒。")}
                </small>
              </span>
            </button>
          </div>
        </div>

        <div className="confirm-dialog__actions confirm-dialog__actions--footer">
          <button className="settings-action-button" type="button" onClick={onCancel}>
            取消
          </button>
          <button
            className="settings-action-button settings-action-button--danger"
            type="button"
            onClick={handlePrimaryConfirm}
          >
            {deleteScope === "database" ? "确认删除数据库环境" : "确认删除本地以及数据库环境"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 删除确认弹窗 */
function ConfirmDialog({
  envName,
  onCancel,
  onConfirm,
  title = "确认删除环境",
  resourceType = "环境",
}: {
  envName: string;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  resourceType?: string;
}) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <XCircle size={22} className="confirm-dialog__icon" />
          <h2>{title}</h2>
        </div>

        <p className="confirm-dialog__desc">
          该操作会改变本机任务、服务或配置状态，需确认后继续。
        </p>

        <dl className="confirm-dialog__info">
          <div className="confirm-dialog__row">
            <dt>影响对象</dt>
            <dd>{envName}</dd>
          </div>
          <div className="confirm-dialog__row">
            <dt>是否会修改文件或环境</dt>
            <dd>确认后会按当前权限执行</dd>
          </div>
          <div className="confirm-dialog__row">
            <dt>资源影响</dt>
            <dd>会从{resourceType}列表移除该{resourceType}记录，并清理项目和任务中的{resourceType}引用；不会删除本地{resourceType}目录。</dd>
          </div>
          <div className="confirm-dialog__row">
            <dt>是否可撤销</dt>
            <dd>是</dd>
          </div>
        </dl>

        <p className="confirm-dialog__risk">
          <strong>AI 风险提示：</strong>请确认目标、资源占用和上下文后再继续。
        </p>

        <div className="confirm-dialog__actions">
          <button
            className="settings-action-button"
            type="button"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="settings-action-button settings-action-button--danger"
            type="button"
            onClick={onConfirm}
          >
            确认删除{resourceType}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [profile, setProfile] = useState({
    username: "admin",
    account: "local-user@example.com",
    workspace: "D:/workspace",
    datasetPath: "D:/datasets",
    modelPath: "D:/models",
    exportPath: "D:/reports",
    project: "工业缺陷检测实验",
    density: "标准",
    pathDisplay: "显示盘符，隐藏用户名",
  });

  function updateProfile(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="profile-settings">
      <div className="profile-account">
        <div className="profile-card-head">
          <span className="profile-avatar">
            <User size={30} />
          </span>
          <div>
            <h2>admin</h2>
            <p>本机账户</p>
          </div>
        </div>
        <div className="profile-field-grid">
          <EditableField
            label="用户名"
            onChange={(value) => updateProfile("username", value)}
            value={profile.username}
          />
          <EditableField
            label="账号信息"
            onChange={(value) => updateProfile("account", value)}
            value={profile.account}
          />
          <PathField
            label="默认工作区"
            onChange={(value) => updateProfile("workspace", value)}
            value={profile.workspace}
          />
          <PathField
            label="默认数据路径"
            onChange={(value) => updateProfile("datasetPath", value)}
            value={profile.datasetPath}
          />
          <PathField
            label="默认模型路径"
            onChange={(value) => updateProfile("modelPath", value)}
            value={profile.modelPath}
          />
          <PathField
            label="默认导出路径"
            onChange={(value) => updateProfile("exportPath", value)}
            value={profile.exportPath}
          />
        </div>
      </div>
      <div className="profile-preferences">
        <h2>偏好配置</h2>
        <SelectField
          label="默认项目"
          onChange={(value) => updateProfile("project", value)}
          options={["工业缺陷检测实验", "客服问答 SFT", "自然场景分类实验", "知识库 Rerank 实验"]}
          value={profile.project}
        />
        <SelectField
          label="界面密度"
          onChange={(value) => updateProfile("density", value)}
          options={["紧凑", "标准", "宽松"]}
          value={profile.density}
        />
        <SelectField
          label="路径显示"
          onChange={(value) => updateProfile("pathDisplay", value)}
          options={["显示完整路径", "显示盘符，隐藏用户名", "仅显示目录名"]}
          value={profile.pathDisplay}
        />
        <div className="profile-actions">
          <button type="button">恢复默认</button>
          <button type="button">
            <Save size={15} />
            保存偏好
          </button>
        </div>
      </div>
    </section>
  );
}

function EditableField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function PathField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="profile-field">
      <span>{label}</span>
      <div className="profile-path-control">
        <input onChange={(event) => onChange(event.target.value)} value={value} />
        <button
          onClick={() => inputRef.current?.click()}
          type="button"
          title="选择文件夹"
        >
          <FolderOpen size={15} />
        </button>
        <input
          ref={inputRef}
          className="profile-folder-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            const electronPath = file ? (file as File & { path?: string }).path : "";
            const path = electronPath || (file ? file.webkitRelativePath.split("/")[0] : "");
            if (path) {
              onChange(path);
            }
          }}
          type="file"
          // @ts-expect-error webkitdirectory is supported by Chromium/Electron.
          webkitdirectory=""
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
