import { useMemo, useRef, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  FilePenLine,
  Lightbulb,
  Paperclip,
  Plus,
  Zap,
} from "lucide-react";
import type { AssistMode } from "../layouts/AssistantPanelContext";
import { useAssistantPanel } from "../layouts/AssistantPanelContext";
import { ModelVendorOptionIcon } from "./ModelVendorAvatar";
import { PortalDropdown } from "./PortalDropdown";
import { StatusBadge } from "./StatusBadge";
import type { ReactNode } from "react";

// --- 选项配置 ---
const ASSIST_OPTIONS: { key: AssistMode; label: string; desc: string; icon: typeof Eye }[] = [
  { key: "readonly", label: "只读建议", desc: "AI 只能分析与解释", icon: Eye },
  { key: "assist", label: "辅助填写", desc: "AI 可生成方案", icon: FilePenLine },
  { key: "confirm", label: "确认后执行", desc: "高风险操作仍需确认", icon: CheckCircle },
];

const PLUS_OPTIONS: { key: string; label: string; icon: typeof Paperclip }[] = [
  { key: "upload", label: "上传附件", icon: Paperclip },
  { key: "plan", label: "Plan 模式", icon: Lightbulb },
  { key: "skills", label: "Skills", icon: Zap },
];

export interface SkillOption {
  key: string;
  label: string;
  color: string;
}

export const SKILL_OPTIONS: SkillOption[] = [
  { key: "find-skills", label: "find-skills", color: "#8b5cf6" },
  { key: "frontend-design", label: "frontend-design", color: "#3b82f6" },
  { key: "electron-development", label: "electron-development", color: "#10b981" },
];

const PROJECT_OPTIONS = [
  { key: "none", label: "不关联" },
  { key: "defect", label: "工业缺陷检测" },
  { key: "support", label: "客服问答 SFT" },
  { key: "embedding", label: "本地 Embedding 评估" },
];

// --- Props ---
interface PromptToolbarProps {
  sendButton?: ReactNode;
  className?: string;
  plusClassName?: string;
  assistClassName?: string;
  modelClassName?: string;
  onFilesSelected?: (files: File[]) => void;
  onAttachmentsSelected?: (attachments: Array<{ name: string; path: string; kind?: "file" | "directory" }>) => void;
  onPlanModeToggle?: () => void;
  onSkillToggle?: (skill: SkillOption) => void;
}

// --- 工具栏 ---
export function PromptToolbar({
  sendButton,
  className,
  plusClassName,
  assistClassName,
  modelClassName,
  onFilesSelected,
  onAttachmentsSelected,
  onPlanModeToggle,
  onSkillToggle,
}: PromptToolbarProps) {
  const { assistMode, setAssistMode, modelList, currentModel, switchModel } = useAssistantPanel();
  const [openMenu, setOpenMenu] = useState<"plus" | "assist" | "model" | null>(null);
  const [skillsSubOpen, setSkillsSubOpen] = useState(false);
  const [switchingModelId, setSwitchingModelId] = useState<string | null>(null);
  const [modelSwitchError, setModelSwitchError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAssist = ASSIST_OPTIONS.find((o) => o.key === assistMode) ?? ASSIST_OPTIONS[0];
  const selectableModels = useMemo(() => {
    const availableModels = modelList.filter((model) => model.status === "可用");
    return availableModels.length > 0 ? availableModels : modelList;
  }, [modelList]);
  const activeModelLabel = currentModel ? currentModel.name : (modelList.length > 0 ? "选择模型" : "暂无模型");

  const handleModelSelect = async (modelId: string) => {
    if (modelId === currentModel?.id || switchingModelId) return;
    setSwitchingModelId(modelId);
    setModelSwitchError("");
    try {
      await switchModel(modelId);
      setOpenMenu(null);
    } catch (error) {
      setModelSwitchError(error instanceof Error ? error.message : "模型切换失败，请重试");
    } finally {
      setSwitchingModelId(null);
    }
  };

  const handlePlusOptionClick = async (key: string) => {
    if (key === "skills") {
      setSkillsSubOpen(true);
      return;
    }

    setOpenMenu(null);
    setSkillsSubOpen(false);

    if (key === "upload") {
      const hasElectronAPI = Boolean(window.ysyDesktop?.selectAttachments);

      if (onAttachmentsSelected && hasElectronAPI) {
        const attachments = await window.ysyDesktop!.selectAttachments!();
        if (attachments.length > 0) {
          onAttachmentsSelected(attachments);
        }
        return;
      }

      if (onFilesSelected) {
        fileInputRef.current?.click();
      }
      return;
    }

    if (key === "plan") {
      onPlanModeToggle?.();
      return;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected?.(files);
    }
    event.target.value = "";
  };

  return (
    <div className={className || "prompt-tools"}>
      <input
        ref={fileInputRef}
        className="prompt-file-input"
        type="file"
        multiple
        onChange={handleFileChange}
      />

      {/* +号 */}
      <PortalDropdown
        open={openMenu === "plus"}
        onClose={() => { setOpenMenu(null); setSkillsSubOpen(false); }}
        align="left"
        menuClassName={`prompt-dropdown${skillsSubOpen ? " prompt-dropdown--skills" : ""}`}
        trigger={
          <button
            className={`round-button${openMenu === "plus" ? " round-button--active" : ""}${plusClassName ? ` ${plusClassName}` : ""}`}
            type="button"
            title="更多选项"
            onClick={() => { setOpenMenu(openMenu === "plus" ? null : "plus"); setSkillsSubOpen(false); }}
          >
            <Plus size={20} />
          </button>
        }
      >
        <div className={`prompt-dropdown__columns${skillsSubOpen ? " prompt-dropdown__columns--sub" : ""}`}>
          <div className="prompt-dropdown__col">
            {PLUS_OPTIONS.map((opt) => (
              <button
                className={`prompt-dropdown__item${skillsSubOpen && opt.key === "skills" ? " prompt-dropdown__item--active" : ""}`}
                type="button"
                key={opt.key}
                onClick={() => handlePlusOptionClick(opt.key)}
              >
                <opt.icon size={15} className="prompt-dropdown__item-icon" />
                <span>{opt.label}</span>
                {opt.key === "skills" && (
                  <ChevronRight size={12} className="prompt-dropdown__item-arrow" />
                )}
              </button>
            ))}
          </div>
          {skillsSubOpen && (
            <div className="prompt-dropdown__col prompt-dropdown__col--sub">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  className="prompt-dropdown__item"
                  type="button"
                  key={skill.key}
                  onClick={() => {
                    onSkillToggle?.(skill);
                    setOpenMenu(null);
                    setSkillsSubOpen(false);
                  }}
                >
                  <span
                    className="prompt-dropdown__skill-dot"
                    style={{ backgroundColor: skill.color }}
                  />
                  <span>{skill.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PortalDropdown>

      {/* 辅助填写 */}
      <PortalDropdown
        open={openMenu === "assist"}
        onClose={() => setOpenMenu(null)}
        align="left"
        menuClassName="prompt-dropdown prompt-dropdown--assist"
        trigger={
          <button
            className={`prompt-select${openMenu === "assist" ? " prompt-select--open" : ""}${assistClassName ? ` ${assistClassName}` : ""}`}
            type="button"
            onClick={() => setOpenMenu(openMenu === "assist" ? null : "assist")}
          >
            {activeAssist.label}
            <ChevronDown size={14} />
          </button>
        }
      >
        {ASSIST_OPTIONS.map((opt) => (
          <button
            className={`prompt-dropdown__item${opt.key === assistMode ? " prompt-dropdown__item--active" : ""}`}
            type="button"
            key={opt.key}
            onClick={() => {
              setAssistMode(opt.key);
              setOpenMenu(null);
            }}
          >
            <opt.icon size={15} className="prompt-dropdown__item-icon" />
            <div className="prompt-dropdown__item-text">
              <span className="prompt-dropdown__item-label">{opt.label}</span>
              <span className="prompt-dropdown__item-desc">{opt.desc}</span>
            </div>
            {opt.key === assistMode && <span className="prompt-dropdown__check" />}
          </button>
        ))}
      </PortalDropdown>

      {/* 模型选择 */}
      <PortalDropdown
        open={openMenu === "model"}
        onClose={() => setOpenMenu(null)}
        align="right"
        menuClassName="prompt-dropdown prompt-dropdown--model"
        trigger={
          <button
            className={`prompt-select prompt-select--model${openMenu === "model" ? " prompt-select--open" : ""}${modelClassName ? ` ${modelClassName}` : ""}`}
            type="button"
            onClick={() => setOpenMenu(openMenu === "model" ? null : "model")}
          >
            {currentModel ? <ModelVendorOptionIcon provider={currentModel.provider} /> : null}
            <span className="prompt-select__label">{activeModelLabel}</span>
            <ChevronDown size={14} />
          </button>
        }
      >
        {selectableModels.length === 0 ? (
          <div className="prompt-dropdown__empty">请先在设置中添加模型</div>
        ) : (
          <>
            {modelSwitchError && (
              <div className="prompt-dropdown__empty" role="alert">
                {modelSwitchError}
              </div>
            )}
            {selectableModels.map((model) => (
              <button
                className={`prompt-dropdown__item prompt-dropdown__item--model${
                  model.id === currentModel?.id ? " prompt-dropdown__item--active" : ""
                }`}
                type="button"
                key={model.id}
                disabled={Boolean(switchingModelId) || model.status !== "可用"}
                onClick={() => void handleModelSelect(model.id)}
              >
                <ModelVendorOptionIcon provider={model.provider} />
                <div className="prompt-dropdown__item-text">
                  <span className="prompt-dropdown__item-label">{model.name}</span>
                  <span className="prompt-dropdown__item-desc">{model.provider}</span>
                </div>
                <StatusBadge label={switchingModelId === model.id ? "切换中" : model.status} tone={model.tone} />
                {model.id === currentModel?.id && <span className="prompt-dropdown__check" />}
              </button>
            ))}
          </>
        )}
      </PortalDropdown>

      {sendButton}
    </div>
  );
}

// --- 项目选择器 ---
export function ProjectSelect({ className }: { className?: string }) {
  const { selectedProject, setSelectedProject } = useAssistantPanel();
  const [open, setOpen] = useState(false);

  return (
    <div className={className || "prompt-project"}>
      项目：
      <PortalDropdown
        open={open}
        onClose={() => setOpen(false)}
        align="left"
        menuClassName="prompt-dropdown prompt-dropdown--project"
        trigger={
          <button
            type="button"
            className={`prompt-project__select${open ? " prompt-select--open" : ""}`}
            onClick={() => setOpen((v) => !v)}
          >
            {PROJECT_OPTIONS.find((p) => p.key === selectedProject)?.label ?? "不关联"}
            <ChevronDown size={13} />
          </button>
        }
      >
        {PROJECT_OPTIONS.map((proj) => (
          <button
            className={`prompt-dropdown__item${proj.key === selectedProject ? " prompt-dropdown__item--active" : ""}`}
            type="button"
            key={proj.key}
            onClick={() => {
              setSelectedProject(proj.key);
              setOpen(false);
            }}
          >
            <span>{proj.label}</span>
            {proj.key === selectedProject && <span className="prompt-dropdown__check" />}
          </button>
        ))}
      </PortalDropdown>
    </div>
  );
}
