import { Copy, Plus, Stethoscope } from "lucide-react";
import { ConfirmPlaceholder } from "../components/ConfirmPlaceholder";
import { StatusBadge } from "../components/StatusBadge";
import { Toolbar } from "../components/Toolbar";
import { tasks } from "../mocks/prototypeData";

export function TasksPage() {
  return (
    <section className="workbench-page">
      <div className="page-header">
        <div className="page-header__left" aria-hidden="true" />
        <button className="primary-button" type="button">
          <Plus size={16} />
          创建训练任务
        </button>
      </div>
      <div className="segmented">
        <button className="is-active" type="button">训练任务</button>
        <button type="button">部署任务</button>
      </div>
      <Toolbar>
        <button type="button">全部项目</button>
        <button type="button">全部状态</button>
      </Toolbar>
      <div className="table-list">
        {tasks.map((task) => (
          <article className="table-card" key={task.id}>
            <div className="table-card__main">
              <div className="card-heading">
                <h2>{task.name}</h2>
                <StatusBadge label={task.status} tone={task.tone} />
              </div>
              <div className="progress-track" aria-label={`任务进度 ${task.progress}`}>
                <span style={{ width: task.progress === "50/50" ? "100%" : task.progress === "32/50" ? "64%" : "8%" }} />
              </div>
              <div className="meta-grid">
                <span>任务进度：{task.progress}</span>
                <span>项目：{task.project}</span>
                <span>数据集：{task.assetLabel}</span>
                <span>运行环境：{task.environment}</span>
              </div>
            </div>
            <div className="table-card__actions">
              <time>{task.updatedAt}</time>
              <button type="button">编辑</button>
              <button type="button">
                <Copy size={13} />
                复制
              </button>
              <ConfirmPlaceholder label="删除" />
              <ConfirmPlaceholder label={task.canStop ? "终止" : "启动"} />
              <button type="button">
                <Stethoscope size={13} />
                AI 诊断
              </button>
            </div>
          </article>
        ))}
      </div>
      <footer className="count-footer">共 {tasks.length} 条记录</footer>
    </section>
  );
}
