# Proposal: development-openspec-governance

## 背景

当前仓库已有 `docs/specs/changes/`、`AGENTS.md` 和 V1 PRD，但用户要求基于当前仓库与外部《V1.0 PRD.md》生成一套可直接落库的 OpenSpec + Git + AI Coding 开发规范。

## 目标

- 新增 `docs/development/` 下的 Git、OpenSpec、Spec 治理、PR Review 和 AI Coding 规范。
- 新增 `openspec/` 分层目录，包括 Global Spec、Module Spec 和 Changes 入口说明。
- 更新根目录 `AGENTS.md`，让 Codex / Claude Code 等 AI Coding 工具优先读取 OpenSpec 规范。
- 明确代码按模块组织、Spec Change 按需求组织、Git 分支绑定代码和需求。

## 非目标

- 不修改业务代码。
- 不迁移既有 `docs/specs/changes/` 历史记录。
- 不切换桌面壳技术栈。
- 不调整前后端 API 或数据模型实现。

## 用户入口

UI 入口：

- 无产品 UI 入口，本变更是开发治理文档。

AI 入口：

- AI Coding 工具通过 `AGENTS.md`、`openspec/global/global.spec.md`、`openspec/modules/*.spec.md` 和 `docs/development/*.md` 读取项目规则。

## 需求说明

### Requirement: 开发规范落库

系统仓库必须包含可执行的 OpenSpec + Git + AI Coding 开发规范。

#### Scenario: 新成员或 AI Agent 开始需求开发

Given：

- 开发者或 AI Agent 克隆仓库。

When：

- 开始一个新的功能变更。

Then：

- 能按文档找到分支模型、OpenSpec 分层、Change 目录、PR 检查清单和 AI Coding 禁止事项。

## 影响范围

- 前端：无代码影响。
- 后端：无代码影响。
- AI 编排：无代码影响，新增行为规范。
- 数据模型：无实现影响。
- API：无实现影响。
- 文档：新增开发规范和 OpenSpec 目录，更新 `AGENTS.md`。

## 风险

- 外部请求文本提到 React + Electron，但当前仓库存在 Tauri 配置。规范中已明确以当前仓库实现为准，如切换 Electron 必须独立立项。
