import { ClipboardCheck, Copy, Link2, Plus, Rocket } from "lucide-react";
import { ConfirmPlaceholder } from "../components/ConfirmPlaceholder";
import { StatusBadge } from "../components/StatusBadge";
import { Toolbar } from "../components/Toolbar";
import { models } from "../mocks/prototypeData";

export function ModelsPage() {
  return (
    <section className="workbench-page">
      <div className="page-header">
        <div className="page-header__left" aria-hidden="true" />
        <button className="primary-button" type="button">
          <Plus size={16} />
          导入模型
        </button>
      </div>
      <Toolbar>
        <button type="button">模型类型 全部</button>
        <button type="button">状态 全部</button>
      </Toolbar>
      <div className="table-list">
        {models.map((model) => (
          <article className="asset-row" key={model.id}>
            <div>
              <div className="card-heading">
                <h2>{model.name}</h2>
                <StatusBadge label={model.status} tone={model.tone} />
              </div>
              <div className="path-line">路径：{model.path}</div>
              <div className="meta-grid meta-grid--three">
                <span>类型：{model.type}</span>
                <span>来源：{model.source}</span>
                <span>项目：{model.project}</span>
              </div>
            </div>
            <div className="asset-actions">
              <time>{model.updatedAt}</time>
              <button type="button">
                <Copy size={13} />
                复制
              </button>
              <button type="button">
                <Link2 size={13} />
                {model.project === "-" ? "绑定" : "换绑"}
              </button>
              <button type="button">
                <Rocket size={13} />
                创建部署任务
              </button>
              <ConfirmPlaceholder label="删除" />
              <button type="button">
                <ClipboardCheck size={13} />
                AI 检查
              </button>
            </div>
          </article>
        ))}
      </div>
      <footer className="count-footer">共 {models.length} 条记录</footer>
    </section>
  );
}
