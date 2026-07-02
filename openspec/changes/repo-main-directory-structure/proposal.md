# Proposal: repo-main-directory-structure

## 背景

main 分支需要建立稳定、可扩展、适合团队和 AI Coding 工具读取的仓库代码目录结构。当前文档中仍存在旧目录、Go 后端和 Tauri 表述，与本轮目标结构不一致。

## 目标

- 在 main 分支建立 `frontend/`、`backend/`、`agent/`、`packages/`、`configs/`、`tests/`、`docs/architecture/` 等顶层结构。
- 明确 `frontend/`、`backend/`、`agent/` 的职责。
- 更新 README、AGENTS、OpenSpec Module Spec 和开发规范中的路径与技术方向。
- 将前端 / 桌面端方向明确为 React + Electron。
- 将后端方向明确为 Python。

## 非目标

- 不初始化真实 React、Electron 或 Python 工程。
- 不初始化真实 React、Electron 或 Python 工程。
- 不选择数据库和具体 Python Web 框架。
- 不删除本地未跟踪产物。

## 影响范围

- 文档：README、AGENTS、开发规范、架构文档、OpenSpec Change。
- OpenSpec：frontend/backend/agent Module Spec 路径和技术边界。
- 代码：仅新增目录 README 占位，不新增运行时代码。

## 风险

- 本地可能存在未提交模块改动，提交时必须避免误纳入。
- 仓库已移除历史 `docs/specs/`，当前规范依据统一来自 `openspec/`。
