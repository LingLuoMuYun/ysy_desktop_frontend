/**
 * 项目表单公共辅助组件
 *
 * 从 ProjectsPage 迁出的纯展示组件，不直接调用 API 或 Service。
 */

import type { ProjectEnvironmentOption } from "../../services/projectsApi";

/** 加载 / 空态 / 错误占位 */
export function ProjectState({
  title,
  desc,
  actionLabel,
  onAction,
}: {
  title: string;
  desc: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="project-state">
      <strong>{title}</strong>
      <span>{desc}</span>
      {actionLabel && onAction && (
        <button className="project-card__action-btn project-card__action-btn--primary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** 确认信息行：label / value 键值对 */
export function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="confirm-dialog__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** 表单文本字段 */
export function ProjectTextField({
  label,
  value,
  required,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="project-dialog__field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

/** 表单下拉字段，支持 string[] 或 ProjectEnvironmentOption[] */
export function ProjectSelectField({
  label,
  value,
  options,
  optionalLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[] | ProjectEnvironmentOption[];
  optionalLabel?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="project-dialog__field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {optionalLabel && <option value="">{optionalLabel}</option>}
        {options.map((option) => {
          const valueKey = typeof option === "string" ? option : option.id;
          const labelText =
            typeof option === "string"
              ? option
              : `${option.name}${option.statusText ? ` / ${option.statusText}` : ""}`;
          return (
            <option key={valueKey} value={valueKey}>
              {labelText}
            </option>
          );
        })}
      </select>
    </label>
  );
}
