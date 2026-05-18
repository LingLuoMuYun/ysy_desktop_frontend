# Proposal: stack-go-python-ai

## 背景

团队已明确新的技术方向：业务后端采用 Go，AI 助手部分采用 Python，数据库暂时未确定。现有规划文档中曾建议 Python FastAPI 和 SQLite 起步，需要更新为新的决策，避免后续 Codex agent 和团队成员按旧方案初始化工程。

## 目标

- 更新 0-1 开发规划中的技术方向
- 更新 vibe coding 协作职责
- 更新 `AGENTS.md` 中的 agent 执行协议
- 更新 `README.md` 中的当前技术方向
- 明确数据库仍为待决策项

## 非目标

- 不初始化 Go 后端工程
- 不初始化 Python AI 助手工程
- 不选择具体数据库
- 不选择具体 Go HTTP 框架

## 用户入口

UI 入口：

- 无，本次为开发规划更新

AI 入口：

- Codex agent 后续根据 `AGENTS.md` 和规划文档，按 Go 后端、Python AI 助手的边界开展开发

## 需求说明

### Requirement: 更新技术栈方向

项目文档必须说明业务后端采用 Go，AI 助手部分采用 Python，数据库暂未确定。

#### Scenario: 新成员准备初始化工程

Given：

- 新成员阅读项目文档

When：

- 查看 README、开发规划或 AGENTS

Then：

- 能明确 Go 负责业务后端和本地执行，Python 负责 AI 助手与智能编排，数据库仍需选型

## 影响范围

- 前端：无
- 后端：技术方向更新为 Go
- AI 编排：技术方向更新为 Python
- 数据模型：数据库选型暂未确定，需要通过抽象隔离
- API：强调 Go/Python 服务契约
- 文档：更新 README、开发规划、vibe coding 规范和 AGENTS

## 风险

- Go 与 Python 服务边界如果不清晰，可能导致状态源分散
- 数据库未定期间，如果过早绑定具体数据库特性，后续迁移成本会升高
