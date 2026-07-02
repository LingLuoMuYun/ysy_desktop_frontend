# Acceptance: repo-main-directory-structure

## 验收环境

- 日期：2026-07-01
- 分支：main
- 操作系统：Windows

## 验收用例

- [x] 顶层目录结构文件均已创建。
- [x] README 包含目标仓库结构说明。
- [x] AGENTS 指向 `frontend/`、`backend/`、`agent/` 和 `packages/shared/`。
- [x] OpenSpec Module Spec 指向新目录。
- [x] 文档中当前技术方向为 React + Electron、Python 后端、Python AI 助手。
- [x] 未跟踪旧 `frontend/`、`output/` 和 PDF 文件未被纳入提交。

## 测试结果

```text
Test-Path frontend, backend, agent, packages/shared, scripts, tests, configs, docs/architecture: all present.
git diff --check: passed.
Current-doc scan: no active Tauri or Go backend references remain; only the repository-structure migration note mentions old root paths intentionally.
git status: unrelated module directory edits remain unstaged.
```

## 遗留问题

- 仓库已移除历史 `docs/specs/`，当前规范依据统一来自 `openspec/`。
