/**
 * 项目创建对话框
 *
 * 两步流程：填写表单 → 确认信息 → 提交创建。
 * 从 ProjectsPage 迁出，props 接口不变。
 */

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { ScrollArea } from "../../components/ScrollArea";
import type { ProjectSpecs } from "../../services/projectsApi";
import { projectsApi } from "../../services/projectsApi";
import { ConfirmRow, ProjectSelectField, ProjectTextField } from "./projectFormHelpers";

interface ProjectFormValues {
  name: string;
  type: string;
  description: string;
  workspace: string;
  environmentId: string;
}

export function ProjectCreateDialog({
  specs,
  onClose,
  onCreated,
}: {
  specs: ProjectSpecs;
  onClose: () => void;
  onCreated: (projectName: string) => Promise<void>;
}) {
  const [values, setValues] = useState<ProjectFormValues>({
    name: "",
    type: specs.projectTypes[0] || "",
    description: "",
    workspace: specs.workspaceOptions[0] || "",
    environmentId: specs.compatibleEnvironments[0]?.id || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedEnvironment = specs.compatibleEnvironments.find(
    (environment) => environment.id === values.environmentId,
  );

  const updateValue = (key: keyof ProjectFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!values.name.trim() || !values.type || !values.workspace.trim()) {
      setError("请填写项目名称、项目类型和项目保存位置。");
      return;
    }
    setIsSubmitting(true);
    try {
      const validation = await projectsApi.validateWorkspace(values.workspace.trim());
      if (!validation.ok || !validation.exists || !validation.allowed) {
        setError("项目保存位置未通过后端路径校验。");
        return;
      }
      setShowConfirm(true);
    } catch (validateError) {
      setError(validateError instanceof Error ? validateError.message : "项目保存位置校验失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await projectsApi.create({
        name: values.name.trim(),
        type: values.type,
        description: values.description.trim(),
        workspace: values.workspace.trim(),
        environmentId: values.environmentId || undefined,
      });
      await onCreated(values.name.trim());
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "项目创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="env-create-overlay">
        <div
          className="env-create-dialog env-create-dialog--confirm project-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-create-confirm-title"
        >
          <header className="env-create-dialog__header">
            <h2 id="project-create-confirm-title">确认创建项目</h2>
            <button
              className="env-create-dialog__close"
              disabled={isSubmitting}
              onClick={() => setShowConfirm(false)}
              title="返回"
              type="button"
            >
              <X size={16} />
            </button>
          </header>
          <ScrollArea className="env-create-dialog__body env-create-confirm-body">
            <p className="confirm-dialog__desc">
              创建项目会新增产品内项目记录，确认后提交后端创建接口。
            </p>
            <dl className="confirm-dialog__info">
              <ConfirmRow label="项目名称" value={values.name} />
              <ConfirmRow label="项目类型" value={values.type} />
              <ConfirmRow label="保存位置" value={values.workspace} />
              <ConfirmRow
                label="默认环境"
                value={selectedEnvironment?.name || "未选择"}
              />
            </dl>
            <p className="confirm-dialog__risk">
              <strong>中风险操作：</strong>
              本次请求会传入 `confirmed=true`，不提交代码入口、依赖文件或初始数据集绑定。
            </p>
            {error && <p className="project-dialog__error">{error}</p>}
          </ScrollArea>
          <footer className="env-create-dialog__footer">
            <div className="env-create-dialog__actions">
              <button
                className="settings-action-button"
                disabled={isSubmitting}
                onClick={() => setShowConfirm(false)}
                type="button"
              >
                返回修改
              </button>
              <button
                className="settings-action-button settings-action-button--primary"
                disabled={isSubmitting}
                onClick={handleConfirm}
                type="button"
              >
                {isSubmitting ? "提交中..." : "确认创建项目"}
              </button>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="env-create-overlay">
      <form
        className="env-create-dialog project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-create-title"
        onSubmit={handleSubmit}
      >
        <header className="env-create-dialog__header">
          <h2 id="project-create-title">创建项目</h2>
          <button className="env-create-dialog__close" onClick={onClose} title="关闭" type="button">
            <X size={16} />
          </button>
        </header>
        <div className="env-create-dialog__body project-dialog__body">
          <ProjectTextField
            label="项目名称"
            value={values.name}
            onChange={(value) => updateValue("name", value)}
            required
          />
          <ProjectSelectField
            label="项目类型"
            value={values.type}
            options={specs.projectTypes}
            onChange={(value) => updateValue("type", value)}
          />
          <ProjectTextField
            label="项目保存位置"
            value={values.workspace}
            onChange={(value) => updateValue("workspace", value)}
            required
          />
          <ProjectSelectField
            label="默认运行环境"
            value={values.environmentId}
            options={specs.compatibleEnvironments}
            onChange={(value) => updateValue("environmentId", value)}
            optionalLabel="不绑定默认环境"
          />
          <label className="project-dialog__field">
            <span>项目描述</span>
            <textarea
              value={values.description}
              onChange={(event) => updateValue("description", event.target.value)}
              rows={4}
            />
          </label>
          {error && <p className="project-dialog__error">{error}</p>}
        </div>
        <footer className="env-create-dialog__footer">
          <div className="env-create-dialog__actions">
            <button
              className="settings-action-button"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="settings-action-button settings-action-button--primary"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "校验中..." : "下一步"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
