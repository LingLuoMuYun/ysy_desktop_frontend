# 智算桌面

面向本地深度学习实验和轻量大模型工作流的桌面应用。项目目标是把项目管理、环境配置、模型训练、模型服务和 AI 助手统一到一个前后端分离的产品中。

当前仓库处于 0-1 规划阶段，`V1.pdf` 是原始 PRD，Markdown 版需求和开发规范已整理到 `docs/`。

当前技术方向：前后端分离，业务后端采用 Go，AI 助手与智能编排部分采用 Python，数据库暂未确定。

## 文档入口

- [V1 PRD](docs/prd/V1.md)
- [0-1 开发规划](docs/planning/development-plan.md)
- [Vibe Coding 协作规范](docs/process/vibe-coding.md)
- [需求变更规范](docs/specs/README.md)
- [Codex Agent 工作协议](AGENTS.md)

## 协作原则

1. 所有功能同时支持用户点击入口和 AI 助手入口。
2. 所有需求变更先写 spec，再开发，再验证，再提交 git。
3. 每次功能修改必须留下文档记录和独立 git commit。
4. 三人协作默认按前端、后端/本地执行、AI/产品编排拆分职责。
