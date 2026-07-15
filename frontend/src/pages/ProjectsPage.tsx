import { ChevronDown, FolderKanban, Plus, Search } from "lucide-react";
import { ScrollArea } from "../components/ScrollArea";
import { StatusBadge } from "../components/StatusBadge";
import { projects } from "../mocks/prototypeData";
import "./ProjectsPage.css";

const projectIconVariants = ["blue", "slate", "violet", "green", "blue"] as const;

export function ProjectsPage() {
  const pageSize = 5;
  const currentPage = 1;
  const totalProjects = projects.length;
  const totalPages = Math.ceil(totalProjects / pageSize);
  const visibleProjects = projects.slice(0, pageSize);

  return (
    <section className="workbench-page project-page">
      <div className="project-page__toolbar">
        <div className="project-page__filters">
          <button className="project-filter" type="button">
            <span>项目类型</span>
            <strong>全部</strong>
            <ChevronDown size={17} />
          </button>
          <button className="project-filter" type="button">
            <span>状态</span>
            <strong>全部</strong>
            <ChevronDown size={17} />
          </button>
        </div>

        <button className="project-create-button" type="button">
          <Plus size={19} />
          创建项目
        </button>
      </div>

      <label className="project-search">
        <Search size={24} />
        <span aria-hidden="true" />
        <input aria-label="搜索项目名称或路径" placeholder="搜索名称 / 路径..." type="search" />
      </label>

      <div className="project-list-shell">
        <ScrollArea className="project-grid">
          {visibleProjects.map((project, index) => (
            <article className="project-card" key={project.id}>
              <div
                className={`project-card__icon project-card__icon--${projectIconVariants[index % projectIconVariants.length]}`}
                aria-hidden="true"
              >
                <FolderKanban size={31} strokeWidth={1.9} />
              </div>

              <div className="project-card__body">
                <div className="project-card__heading">
                  <h2>{project.name}</h2>
                  <StatusBadge label={project.status} tone={project.tone} />
                </div>
                <p>{project.description}</p>
                <div className="project-card__path">路径： {project.path}</div>
                <div className="project-card__meta">
                  <span>训练任务：{project.trainingTasks}</span>
                  <span>部署任务：{project.deploymentTasks}</span>
                  <span>数据集：{project.datasetCount}</span>
                </div>
              </div>

              <time>{project.updatedAt}</time>

              <button className="project-card__edit-placeholder" aria-label="编辑项目，暂未接入" type="button" />
            </article>
          ))}
        </ScrollArea>

        <div className="project-page__pagination">
          <span>第 {currentPage} 页 / 共 {totalPages} 页</span>
          <span>共 {totalProjects} 个项目</span>
        </div>
      </div>
    </section>
  );
}
