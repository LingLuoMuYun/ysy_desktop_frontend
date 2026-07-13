import { useState } from "react";
import { HardDrive, Rocket, Trash2 } from "lucide-react";
import { localResourceOverview } from "../mocks/prototypeData";

interface LocalResourcePopoverProps {
  open: boolean;
}

function getUsageColor(percent: number): string {
  if (percent > 85) return "var(--red)";
  if (percent > 60) return "#f59f00";
  return "var(--green)";
}

export function LocalResourcePopover({ open }: LocalResourcePopoverProps) {
  const [activeDriveIndex, setActiveDriveIndex] = useState(0);
  const drives = localResourceOverview.disk.drives;
  const activeDrive = drives[activeDriveIndex];
  const usagePercent = Math.round((activeDrive.used / activeDrive.total) * 100);
  const barColor = getUsageColor(usagePercent);
  const freeSpace = activeDrive.total - activeDrive.used;

  if (!open) return null;

  return (
    <aside className="local-resource-panel" aria-label="本机资源概览">
      <section className="local-resource-card">
        <div className="local-resource-card__header">
          <h2>资源概览</h2>
          <button className="local-resource-action" type="button">
            <Rocket size={13} />
            加速
          </button>
        </div>

        <div className="local-resource-metrics" aria-label="资源占用">
          {localResourceOverview.metrics.map((metric) => (
            <div className="local-resource-metric" key={metric.id}>
              <span>{metric.label}</span>
              <strong>
                {metric.value}
                <small>{metric.unit}</small>
              </strong>
            </div>
          ))}
        </div>

        <div className="local-resource-section-title">
          <h3>磁盘空间</h3>
          <button className="local-resource-action" type="button">
            <Trash2 size={13} />
            清理
          </button>
        </div>

        {/* 磁盘 Tab 切换栏 */}
        <div className="local-resource-drive-tabs" aria-label="磁盘分区">
          {drives.map((drive, index) => (
            <button
              type="button"
              key={drive.name}
              className={index === activeDriveIndex ? "active" : ""}
              onClick={() => setActiveDriveIndex(index)}
            >
              {drive.name}
            </button>
          ))}
        </div>

        {/* 当前磁盘详情 */}
        <div className="local-resource-drive-detail">
          <div className="local-resource-drive-detail__header">
            <HardDrive size={16} className="local-resource-drive-detail__icon" />
            <div className="local-resource-drive-detail__info">
              <span className="local-resource-drive-detail__name">{activeDrive.name}</span>
              <span className="local-resource-drive-detail__label">{activeDrive.label}</span>
            </div>
            <div className="local-resource-drive-detail__stats">
              <span className="local-resource-drive-detail__used">
                {activeDrive.used} {activeDrive.unit}
              </span>
              <span className="local-resource-drive-detail__divider">/</span>
              <span className="local-resource-drive-detail__total">
                {activeDrive.total} {activeDrive.unit}
              </span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="local-resource-drive-bar">
            <div
              className="local-resource-drive-bar__fill"
              style={{ width: `${usagePercent}%`, background: barColor }}
            />
          </div>

          <div className="local-resource-drive-detail__footer">
            <span>
              已用 <strong style={{ color: barColor }}>{usagePercent}%</strong>
            </span>
            <span>
              剩余 <strong>{freeSpace} {activeDrive.unit}</strong>
            </span>
          </div>
        </div>

        {/* 可用空间 & 可释放空间 */}
        <div className="local-resource-disk">
          <div className="local-resource-disk__available">
            <span>可用空间</span>
            <strong>
              {localResourceOverview.disk.available}
              <small>/{localResourceOverview.disk.total}</small>
            </strong>
          </div>
          <div className="local-resource-disk__release">
            <span>可释放空间</span>
            <strong>
              {localResourceOverview.disk.releasable}
              <small> GB</small>
            </strong>
          </div>
        </div>

        <div className="local-resource-section-title local-resource-section-title--plain">
          <h3>实时网速</h3>
        </div>

        <div className="local-resource-network">
          <div>↓ 下载 {localResourceOverview.network.download}</div>
          <div>↑ 上传 {localResourceOverview.network.upload}</div>
        </div>
      </section>

      <section className="local-resource-card local-resource-card--recent">
        <h2>最近操作</h2>
        <div className="local-resource-recent-list">
          {localResourceOverview.recentOperations.map((operation) => (
            <button className="local-resource-recent-item" type="button" key={operation.id}>
              <span>{operation.text}</span>
              <time>{operation.time}</time>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
