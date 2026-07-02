# Spec 治理规范

本规范定义 Global Spec、Module Spec、OpenSpec Change、AGENTS.md 与代码之间的维护边界。

## 权限边界

项目负责人 / 架构负责人负责：

- 维护 `openspec/global/global.spec.md`。
- 审核一级模块、核心数据模型、状态机、AI 动作边界和高风险确认机制。
- 决定是否把多个 OpenSpec Change 中重复出现的规则收敛到 Global Spec 或 Module Spec。
- 审核 AGENTS.md 中会影响 AI Coding 行为的规则。

模块负责人负责：

- 维护对应 `openspec/modules/*.spec.md`。
- 审核模块内 API、状态、表单、页面、任务执行和 AI 上下文规则。
- 确保模块实现不绕过 Global Spec。

开发人员负责：

- 为每个需求创建或更新 `openspec/changes/<change-id>/`。
- 保持代码、测试、文档和 Change 同步。
- 在 PR 中说明是否影响 Global Spec 或 Module Spec。
- 发现 Spec 与实现不一致时先提出修正，不让差异继续扩大。

## 修改规则

普通需求只能修改：

```text
openspec/changes/<change-id>/
frontend/
backend/
agent/
packages/shared/
tests/
docs/
```

以下内容需要负责人确认：

```text
openspec/global/
openspec/modules/
AGENTS.md
```

需要负责人确认的典型情况：

- 新增一级模块。
- 修改 Project、Task、Dataset、ModelAsset、RuntimeEnvironment、AiAssistantModel 的核心字段。
- 新增或修改任务主状态。
- 新增高风险操作类型。
- 允许 AI 执行新的 `action_request`。
- 调整本地文件读写、依赖安装、服务端口暴露规则。
- 切换桌面壳技术栈。

## 桌面壳技术栈规则

V1.0 桌面端采用 React + Electron，并放置在 `frontend/`。

- Electron 主进程、预加载脚本、渲染进程和配置模板必须边界清晰。
- 如后续切换桌面壳，必须先创建独立 OpenSpec Change。
- 切换 Change 必须说明构建、打包、系统权限、文件选择器、窗口控制、自动更新和发布流程影响。
- 不允许在普通功能 PR 中顺手切换桌面壳。

## 定期 Spec Alignment Review

建议每周一次，由项目负责人、架构负责人、模块负责人共同参与。

审查内容：

- 是否有多个 Change 定义了相同字段。
- 是否有 API 命名冲突。
- 是否有状态机被局部需求随意扩展。
- 是否 AI 行为边界被破坏。
- 是否高风险确认机制被绕过。
- 是否 Global Spec 需要收敛更新。
- 是否 Module Spec 需要补充。
- 是否 AGENTS.md 需要更新。
- 是否 dev 中存在已完成但未归档的 Change。

Review 输出：

- 需要合并、废弃或归档的 Change 列表。
- 需要更新的 Global Spec / Module Spec 条目。
- 需要修正的代码或测试。
- 下次 PR 必须遵守的新约束。

## 冲突处理

当 PR、Change、Module Spec、Global Spec 出现冲突时：

1. 先以 Global Spec 为准。
2. Global Spec 未覆盖时，以对应 Module Spec 为准。
3. Module Spec 未覆盖时，以当前 OpenSpec Change 为准。
4. Change 也未覆盖时，回到 PRD 和负责人确认。
5. 不允许通过“代码已经实现”反向证明需求合理。
