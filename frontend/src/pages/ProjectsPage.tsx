import { Copy, Plus, Rocket } from "lucide-react";
import { ConfirmPlaceholder } from "../components/ConfirmPlaceholder";
import { StatusBadge } from "../components/StatusBadge";
import { Toolbar } from "../components/Toolbar";
import { projects } from "../mocks/prototypeData";

export function ProjectsPage() {
  return (
    <section className="workbench-page">
      <PageHeader action="创建项目" />
      <Toolbar>
        <button type="button">全部项目类型</button>
        <button type="button">全部状态</button>
      </Toolbar>
      <div className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="card-heading">
              <div>
                <h2>{project.name}</h2>
                <StatusBadge label={project.status} tone={project.tone} />
              </div>
              <button className="ghost-action" type="button">
                <Copy size={13} />
                复制
              </button>
            </div>
            <p>{project.description}</p>
            <div className="path-line">路径：{project.path}</div>
            <div className="summary-grid">
              <span>训练任务：{project.trainingTasks}</span>
              <span>部署任务：{project.deploymentTasks}</span>
              <span>数据集：{project.datasetCount}</span>
              <time>{project.updatedAt}</time>
            </div>
            <div className="row-actions">
              <ConfirmPlaceholder label="删除" />
              <button type="button">
                <Rocket size={13} />
                创建推理任务
              </button>
              <button type="button">创建训练任务</button>
            </div>
          </article>
        ))}
      </div>
      <footer className="count-footer">共 {projects.length} 个项目</footer>
    </section>
  );
}

function PageHeader({ action }: { action: string }) {
  return (
    <div className="page-header">
      <div className="page-header__left" aria-hidden="true" />
      <button className="primary-button" type="button">
        <Plus size={16} />
        {action}
      </button>
    </div>
  );
}
