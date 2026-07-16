/**
 * 项目列表页
 *
 * 薄组装层：负责页面级装配、Toast 通知、对话框显隐协调和详情 / 删除桥接。
 * 列表筛选、搜索、分页逻辑集中在 useProjectList Hook 中。
 */

import { useState } from "react";
import { ChevronDown, FolderKanban, Plus, Search } from "lucide-react";
import { PortalDropdown } from "../components/PortalDropdown";
import { ScrollArea } from "../components/ScrollArea";
import { StatusBadge } from "../components/StatusBadge";
import { Toast } from "../components/Toast";
import { projectsApi, type ProjectDetail } from "../services/projectsApi";
import type { ProjectSummary } from "../types/domain";
import { useProjectList } from "../features/projects/useProjectList";
import { ProjectCreateDialog } from "../features/projects/ProjectCreateDialog";
import { ProjectDeleteDialog } from "../features/projects/ProjectDeleteDialog";
import { ProjectDetailDialog } from "../features/projects/ProjectDetailDialog";
import { ProjectState } from "../features/projects/projectFormHelpers";
import "./ProjectsPage.css";

/** 项目卡片图标渐变色循环 */
const projectIconVariants = ["blue", "slate", "violet", "green", "blue", "violet", "slate"] as const;

export function ProjectsPage() {
  const {
    listState,
    isLoading,
    listError,
    reload,
    keyword,
    selectedType,
    selectedStatus,
    currentPage,
    setKeyword,
    setSelectedType,
    setSelectedStatus,
    setCurrentPage,
    specs,
    typeOptions,
    statusOptions,
  } = useProjectList();

  const selectedStatusLabel =
    statusOptions.find((option) => option.value === selectedStatus)?.label || "全部";

  // 对话框状态
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [detailTarget, setDetailTarget] = useState<ProjectSummary | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "danger";
  } | null>(null);

  // 详情加载桥接（页面级：跨对话框和 API 的协调逻辑）
  const handleOpenDetail = async (project: ProjectSummary) => {
    setDetailTarget(project);
    setProjectDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);
    try {
      const detail = await projectsApi.detail(project.id);
      setProjectDetail(detail);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "项目详情加载失败");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 删除桥接
  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      await projectsApi.delete(deleteTarget.id);
      setToast({ message: `已删除项目：${deleteTarget.name}`, tone: "success" });
      setDeleteTarget(null);
      await reload();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "项目删除失败",
        tone: "danger",
      });
    }
  };

  return (
    <section className="workbench-page project-page">
      {toast && (
        <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}

      {/* 工具栏：筛选 + 创建 */}
      <div className="project-page__toolbar">
        <div className="project-page__filters">
          {/* 项目类型筛选 */}
          <PortalDropdown
            open={openFilter === "type"}
            onClose={() => setOpenFilter(null)}
            align="left"
            menuClassName="prompt-dropdown project-filter-dropdown"
            trigger={
              <button
                className={`project-filter${openFilter === "type" ? " project-filter--open" : ""}`}
                type="button"
                onClick={() => setOpenFilter(openFilter === "type" ? null : "type")}
              >
                <span>项目类型</span>
                <strong>{selectedType}</strong>
                <ChevronDown size={15} />
              </button>
            }
          >
            {typeOptions.map((type) => (
              <button
                key={type}
                className={`prompt-dropdown__item${type === selectedType ? " prompt-dropdown__item--active" : ""}`}
                type="button"
                onClick={() => {
                  setSelectedType(type);
                  setOpenFilter(null);
                }}
              >
                <span className="prompt-dropdown__item-label">{type}</span>
                {type === selectedType && <span className="prompt-dropdown__check" />}
              </button>
            ))}
          </PortalDropdown>

          {/* 状态筛选 */}
          <PortalDropdown
            open={openFilter === "status"}
            onClose={() => setOpenFilter(null)}
            align="left"
            menuClassName="prompt-dropdown project-filter-dropdown"
            trigger={
              <button
                className={`project-filter${openFilter === "status" ? " project-filter--open" : ""}`}
                type="button"
                onClick={() => setOpenFilter(openFilter === "status" ? null : "status")}
              >
                <span>状态</span>
                <strong>{selectedStatusLabel}</strong>
                <ChevronDown size={15} />
              </button>
            }
          >
            {statusOptions.map((status) => {
              const isActiveStatus =
                status.value === selectedStatus || (!status.value && selectedStatus === "全部");
              return (
                <button
                  key={status.value || "all"}
                  className={`prompt-dropdown__item${isActiveStatus ? " prompt-dropdown__item--active" : ""}`}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(status.value || "全部");
                    setOpenFilter(null);
                  }}
                >
                  <span className="prompt-dropdown__item-label">{status.label}</span>
                  {isActiveStatus && <span className="prompt-dropdown__check" />}
                </button>
              );
            })}
          </PortalDropdown>
        </div>

        <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          创建项目
        </button>
      </div>

      {/* 搜索栏 */}
      <label className="project-search">
        <Search size={18} />
        <input
          aria-label="搜索项目名称或路径"
          placeholder="搜索名称 / 路径..."
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>

      {/* 项目列表 */}
      <div className="project-list-shell">
        <ScrollArea className="project-grid">
          {isLoading ? (
            <ProjectState title="正在加载项目" desc="正在从后端读取项目列表。" />
          ) : listError ? (
            <ProjectState
              title="项目列表加载失败"
              desc={listError}
              actionLabel="重试"
              onAction={reload}
            />
          ) : listState.items.length === 0 ? (
            <ProjectState
              title="暂无项目"
              desc="当前筛选条件下没有项目，可调整筛选或创建新项目。"
            />
          ) : (
            listState.items.map((project, index) => (
              <article
                className="project-card"
                key={project.id}
                onClick={() => handleOpenDetail(project)}
              >
                <div
                  className={`project-card__icon project-card__icon--${projectIconVariants[index % projectIconVariants.length]}`}
                  aria-hidden="true"
                >
                  <FolderKanban size={20} strokeWidth={1.9} />
                </div>

                <div className="project-card__body">
                  <div className="project-card__heading">
                    <h2>
                      <button
                        className="project-card__name-btn"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDetail(project);
                        }}
                      >
                        {project.name}
                      </button>
                    </h2>
                    <StatusBadge label={project.status} tone={project.tone} />
                    <div className="project-card__actions project-card__actions--visible">
                      <button
                        className="project-card__action-btn"
                        type="button"
                        title="编辑项目"
                        onClick={(event) => event.stopPropagation()}
                      >
                        编辑
                      </button>
                      <button
                        className="project-card__action-btn"
                        type="button"
                        title="创建部署任务接口待后端确认"
                        onClick={(event) => event.stopPropagation()}
                      >
                        创建部署任务
                      </button>
                      <button
                        className="project-card__action-btn project-card__action-btn--primary"
                        type="button"
                        title="创建训练任务接口待后端确认"
                        onClick={(event) => event.stopPropagation()}
                      >
                        创建训练任务
                      </button>
                    </div>
                  </div>
                  <p>{project.description}</p>
                  <div className="project-card__path path-line">路径：{project.path}</div>
                  <div className="project-card__meta">
                    <span>训练任务：{project.trainingTasks}</span>
                    <span>部署任务：{project.deploymentTasks}</span>
                    <span>数据集：{project.datasetCount}</span>
                    <span>模型：{project.modelCount ?? 0}</span>
                    <time>{project.updatedAt}</time>
                  </div>
                </div>
              </article>
            ))
          )}
        </ScrollArea>

        {/* 分页 */}
        <footer className="project-page__pagination">
          <span>
            第 {listState.total === 0 ? 0 : listState.page} 页 / 共 {listState.totalPages} 页，共{" "}
            {listState.total} 个项目
          </span>
          <div className="project-page__pagination-nav">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </button>
            {Array.from({ length: listState.totalPages }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                className={i + 1 === currentPage ? "is-current" : ""}
                disabled={isLoading}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= listState.totalPages || isLoading}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              下一页
            </button>
          </div>
        </footer>
      </div>

      {/* 创建对话框 */}
      {isCreateOpen && (
        <ProjectCreateDialog
          specs={specs}
          onClose={() => setIsCreateOpen(false)}
          onCreated={async (projectName) => {
            setToast({ message: `已创建项目：${projectName}`, tone: "success" });
            setIsCreateOpen(false);
            await reload();
          }}
        />
      )}

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <ProjectDeleteDialog
          project={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteProject}
        />
      )}

      {/* 详情对话框 */}
      {detailTarget && (
        <ProjectDetailDialog
          project={projectDetail}
          fallback={detailTarget}
          isLoading={isDetailLoading}
          error={detailError}
          onClose={() => {
            setDetailTarget(null);
            setProjectDetail(null);
            setDetailError(null);
          }}
          onRetry={() => handleOpenDetail(detailTarget)}
        />
      )}
    </section>
  );
}
