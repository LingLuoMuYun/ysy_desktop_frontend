/**
 * 项目详情对话框
 *
 * 展示项目基础信息 + 操作记录 / 任务记录 / 模型资产空态 Tab。
 * 从 ProjectsPage 迁出，props 接口不变。
 */

import { Box, FolderKanban, PlayCircle, X } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "../../components/ScrollArea";
import { StatusBadge } from "../../components/StatusBadge";
import type { ProjectDetail } from "../../services/projectsApi";
import type { ProjectSummary } from "../../types/domain";
import { ProjectState } from "./projectFormHelpers";

type ProjectDetailTab = "overview" | "activity" | "tasks" | "models";

const detailTabs: Array<{ id: ProjectDetailTab; label: string }> = [
  { id: "overview", label: "项目概览" },
  { id: "activity", label: "操作记录" },
  { id: "tasks", label: "任务记录" },
  { id: "models", label: "模型资产" },
];

function ProjectOverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="project-detail-overview__row">
      <dt>{label}</dt>
      <dd>{value || "-"}</dd>
    </div>
  );
}

/** 详情 Tab 空态占位 */
function ProjectDetailEmptyPanel({ title }: { title: string }) {
  return (
    <div className="project-detail-empty-panel">
      <strong>{title}</strong>
      <span>本阶段保留空态，后续将复用对应模块列表接口。</span>
    </div>
  );
}

export function ProjectDetailDialog({
  project,
  fallback,
  isLoading,
  error,
  onClose,
  onRetry,
}: {
  project: ProjectDetail | null;
  fallback: ProjectSummary;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>("overview");
  const displayProject = project || fallback;

  return (
    <div className="env-create-overlay">
      <div
        className="env-create-dialog project-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-title"
      >
        <header className="env-create-dialog__header">
          <h2 id="project-detail-title">项目详情</h2>
          <button className="env-create-dialog__close" onClick={onClose} title="关闭" type="button">
            <X size={16} />
          </button>
        </header>
        <ScrollArea className="env-create-dialog__body project-detail-dialog__body">
          {isLoading ? (
            <ProjectState title="正在加载详情" desc="正在请求项目基础信息。" />
          ) : error ? (
            <ProjectState
              title="详情加载失败"
              desc={error}
              actionLabel="重试"
              onAction={onRetry}
            />
          ) : (
            <>
              <div className="project-detail-hero">
                <div className="project-detail-hero__icon" aria-hidden="true">
                  <FolderKanban size={28} strokeWidth={1.9} />
                </div>
                <div className="project-detail-hero__title">
                  <h3>{displayProject.name}</h3>
                  <StatusBadge label={displayProject.status} tone={displayProject.tone} />
                </div>
              </div>

              <div className="project-detail-tabs" role="tablist" aria-label="项目详情">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`project-detail-tabs__tab${activeTab === tab.id ? " project-detail-tabs__tab--active" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <dl className="project-detail-overview">
                  <ProjectOverviewRow label="项目名称" value={displayProject.name} />
                  <ProjectOverviewRow
                    label="项目类型"
                    value={project?.type || displayProject.type || "-"}
                  />
                  <div className="project-detail-overview__row">
                    <dt>项目状态</dt>
                    <dd>
                      <StatusBadge label={displayProject.status} tone={displayProject.tone} />
                    </dd>
                  </div>
                  <ProjectOverviewRow label="项目保存位置" value={displayProject.path} />
                  <ProjectOverviewRow
                    label="默认运行环境"
                    value={project?.environmentName || displayProject.environmentName || "未绑定"}
                  />
                  <ProjectOverviewRow label="更新时间" value={displayProject.updatedAt} />
                </dl>
              )}

              {activeTab === "activity" && <ProjectDetailEmptyPanel title="暂无操作记录" />}
              {activeTab === "tasks" && <ProjectDetailEmptyPanel title="暂无任务记录" />}
              {activeTab === "models" && <ProjectDetailEmptyPanel title="暂无模型资产" />}
            </>
          )}
        </ScrollArea>
        <footer className="env-create-dialog__footer">
          <div className="env-create-dialog__actions project-detail-dialog__actions">
            <button className="settings-action-button" type="button" title="创建部署任务接口待后端确认">
              <Box size={18} />
              创建部署任务
            </button>
            <button
              className="settings-action-button settings-action-button--primary"
              type="button"
              title="创建训练任务接口待后端确认"
            >
              <PlayCircle size={18} />
              创建训练任务
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
