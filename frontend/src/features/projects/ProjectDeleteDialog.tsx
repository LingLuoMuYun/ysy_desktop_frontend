/**
 * 项目删除确认对话框
 *
 * 从 ProjectsPage 迁出，props 接口不变。
 */

import { X } from "lucide-react";
import type { ProjectSummary } from "../../types/domain";
import { ConfirmRow } from "./projectFormHelpers";

export function ProjectDeleteDialog({
  project,
  onCancel,
  onConfirm,
}: {
  project: ProjectSummary;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="confirm-overlay">
      <div
        className="confirm-dialog confirm-dialog--environment"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-delete-title"
      >
        <div className="confirm-dialog__header confirm-dialog__header--plain">
          <h2 id="project-delete-title">确认删除项目</h2>
          <button className="confirm-dialog__close" onClick={onCancel} title="关闭" type="button">
            <X size={16} />
          </button>
        </div>
        <div className="confirm-dialog__content">
          <p className="confirm-dialog__desc">
            删除项目登记并解除关联，默认不删除本地文件。
          </p>
          <dl className="confirm-dialog__info">
            <ConfirmRow label="影响对象" value={project.name} />
            <ConfirmRow label="本地文件" value="不删除，deleteLocalFiles=false" />
            <ConfirmRow label="是否可撤销" value="需由后端数据恢复能力决定" />
          </dl>
          <p className="confirm-dialog__risk confirm-dialog__risk--danger">
            <strong>高风险操作：</strong>
            确认后请求 `DELETE /api/projects/项目ID` 并传 `confirmed=true`。
          </p>
        </div>
        <div className="confirm-dialog__actions confirm-dialog__actions--footer">
          <button className="settings-action-button" onClick={onCancel} type="button">
            取消
          </button>
          <button
            className="settings-action-button settings-action-button--danger"
            onClick={onConfirm}
            type="button"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
