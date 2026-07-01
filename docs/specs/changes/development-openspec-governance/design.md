# Design: development-openspec-governance

## 总体设计

本变更只新增和更新开发治理文档，不修改运行时代码。规范体系分为三层：`openspec/global` 定义系统边界，`openspec/modules` 定义模块约束，`openspec/changes` 承载按需求划分的变更记录。`docs/development` 面向团队执行，`AGENTS.md` 面向 AI Coding 工具读取。

## 文件结构

```text
docs/development/
  git-workflow.md
  openspec-workflow.md
  spec-governance.md
  pr-review-checklist.md
  ai-coding-rules.md

openspec/
  global/global.spec.md
  modules/frontend.spec.md
  modules/backend.spec.md
  modules/agent.spec.md
  changes/README.md
```

## 关键取舍

- 保留既有 `docs/specs/changes/`，不在本次变更中迁移历史记录。
- 新需求优先进入 `openspec/changes/`，历史变更仍可在 `docs/specs/changes/` 追踪。
- 对外部 PRD 中的 Electron 表述与当前仓库 Tauri 实现差异，采用“当前实现为准，切换需独立 Change”的治理规则。

## 数据模型

无数据模型变更。

## API 契约

无 API 变更。

## AI 工具契约

无 AI 工具实现变更；新增 AI Coding 规则和 Agent Module Spec。

## 兼容性

新增文档不影响现有构建、测试和运行流程。
