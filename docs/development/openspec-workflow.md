# OpenSpec 工作流

OpenSpec 是桌面智算项目的需求变更与 AI Coding 规范体系。它不是普通 PRD，也不是代码注释；它用于定义系统边界、模块约束和每次需求变更的验收标准。

## Spec 分层

项目采用三层 Spec：

```text
Global Spec
  ↓
Module Spec
  ↓
OpenSpec Change / Feature Spec
```

优先级从高到低依次为：

1. `openspec/frontend/global/global.spec.md`
2. `openspec/frontend/modules/*.spec.md`
3. `openspec/frontend/changes/<change-id>/` 或 `openspec/changes/<change-id>/`
4. 代码实现与测试

如果低层内容与高层冲突，先暂停实现并修正 Spec，不要静默让代码扩大边界。

## Global Spec

路径：

```text
openspec/frontend/global/global.spec.md
```

Global Spec 定义系统级规则，不是普通 PRD。它应包含：

- 产品定位。
- 系统边界。
- 一级模块。
- 核心数据模型。
- 状态机规则。
- 本地执行规则。
- 文件系统安全规则。
- AI 动作边界。
- 风险确认机制。
- 不在 V1.0 范围内的能力。

维护职责：

- 由项目负责人和架构负责人维护。
- 普通开发人员不能直接修改 Global Spec。
- 如果某个需求确实需要修改 Global Spec，必须在对应 OpenSpec Change 中说明影响范围，由负责人统一修改。

## Module Spec

路径：

```text
openspec/frontend/modules/frontend.spec.md
openspec/frontend/modules/backend.spec.md
openspec/frontend/modules/agent.spec.md
```

Module Spec 定义模块级架构约束。

`frontend.spec.md` 应定义：

- 页面布局。
- 首页、项目、任务、数据、模型、设置六大模块 UI 规则。
- 表单交互规则。
- AI 助手面板规则。
- 高风险操作确认规则。
- 页面上下文传递给 AI 的规则。

`backend.spec.md` 应定义：

- 后端服务边界。
- 核心实体。
- API 设计原则。
- Task 状态机。
- 任务执行器契约。
- 日志采集与读取规则。
- 数据检查、模型检查、环境检测规则。
- 推理服务运行规则。

`agent.spec.md` 应定义：

- AI 助手角色。
- AI 可执行动作类型。
- `explain`、`field_suggestion`、`action_request` 三类行为。
- AI 上下文读取范围。
- AI 禁止行为。
- 脱敏规则。
- 高风险动作确认规则。
- AI 不能绕过后端真实操作入口。

维护职责：

- 由项目负责人、架构负责人或对应模块负责人维护。
- 普通开发人员不能随意修改 Module Spec。
- 涉及公共 API、数据模型、任务状态或 AI 工具契约时，必须先更新相关 Module Spec 或在 Change 中明确升级计划。

## OpenSpec Change / Feature Spec

路径：

```text
openspec/frontend/changes/<change-id>/
```

每个需求必须有独立 OpenSpec Change。分支可以按人或模块划分，但 OpenSpec Change 必须按需求划分。

推荐目录结构：

```text
openspec/frontend/changes/task-create-training-job/
  proposal.md
  design.md
  tasks.md
  specs/
    task/spec.md
```

每个 Change 至少说明：

- 需求背景。
- 目标和非目标。
- 影响模块。
- 用户流程。
- 数据结构变化。
- API 变化。
- 前端交互变化。
- AI 行为变化。
- 风险等级。
- 验收标准。
- 是否需要修改 Global Spec / Module Spec。

## 标准流程

1. 从 `dev` 拉取 `feature/*` 分支。
2. 阅读 Global Spec、相关 Module Spec、当前 PRD 和既有 Change。
3. 创建 `openspec/frontend/changes/<change-id>/`；跨模块或当前已存在顶层变更可使用 `openspec/changes/<change-id>/`。
4. 写 `proposal.md`、`tasks.md`；涉及架构、API、数据模型、状态机或复杂流程时写 `design.md`。
5. 实现代码、测试和文档。
6. 更新 Change 的任务状态与验收记录。
7. 提交 PR 到 `dev`。
8. 进行 Code Review + Spec Review。
9. 合并后在定期 Spec Alignment Review 中检查是否需要收敛到 Global / Module Spec。

## 与历史 specs 目录的关系

本仓库已按 OpenSpec 体系重建，不再保留 `docs/specs/`。

- 新需求优先使用 `openspec/frontend/changes/<change-id>/`；跨模块变更使用 `openspec/changes/<change-id>/` 时必须说明影响模块。
- `openspec/frontend/global/` 和 `openspec/frontend/modules/` 是当前系统与模块约束的权威入口。
- 不允许在 `docs/` 下重新创建平行的 specs 目录。
