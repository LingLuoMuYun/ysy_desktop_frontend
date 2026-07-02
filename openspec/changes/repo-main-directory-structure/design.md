# Design: repo-main-directory-structure

## 目录设计

```text
frontend/
backend/
agent/
packages/
  shared/
configs/
docs/
  architecture/
  development/
  prd/
openspec/
  global/
  modules/
  changes/
scripts/
tests/
```

## 关键约束

- `frontend/` 承载 React + Electron。
- `backend/` 承载 Python 后端、本地执行、检测和服务管理。
- `agent/` 承载 Python AI 助手和智能编排。
- `packages/shared/` 承载跨模块共享契约，前期可为空。
- 模块级实现细则后续由各模块自己的 `AGENTS.md` 维护。

## 兼容性

本变更只新增目录说明和文档，不影响现有运行代码。后续如迁移旧代码，必须创建单独 OpenSpec Change。
