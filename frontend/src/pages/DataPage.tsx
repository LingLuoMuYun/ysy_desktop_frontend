import { ClipboardCheck, Copy, Link2, Plus } from "lucide-react";
import { ConfirmPlaceholder } from "../components/ConfirmPlaceholder";
import { StatusBadge } from "../components/StatusBadge";
import { Toolbar } from "../components/Toolbar";
import { datasets } from "../mocks/prototypeData";

export function DataPage() {
  return (
    <section className="workbench-page">
      <div className="page-header">
        <div className="page-header__left" aria-hidden="true" />
        <button className="primary-button" type="button">
          <Plus size={16} />
          导入数据集
        </button>
      </div>
      <Toolbar>
        <button type="button">适用类型 全部</button>
        <button type="button">状态 全部</button>
      </Toolbar>
      <div className="table-list">
        {datasets.map((dataset) => (
          <article className="asset-row" key={dataset.id}>
            <div>
              <div className="card-heading">
                <h2>{dataset.name}</h2>
                <StatusBadge label={dataset.status} tone={dataset.tone} />
              </div>
              <div className="path-line">路径：{dataset.path}</div>
              <div className="meta-grid meta-grid--three">
                <span>格式：{dataset.format}</span>
                <span>样本：{dataset.samples}</span>
                <span>项目：{dataset.project}</span>
              </div>
            </div>
            <div className="asset-actions">
              <time>{dataset.updatedAt}</time>
              <button type="button">
                <Copy size={13} />
                复制
              </button>
              <button type="button">
                <Link2 size={13} />
                {dataset.project === "-" ? "绑定" : "换绑"}
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
      <footer className="count-footer">共 {datasets.length} 条记录</footer>
    </section>
  );
}
