# ysy_desktop

衍生云桌面智算。

面向本地深度学习实验和轻量大模型工作流的桌面应用。项目目标是把项目管理、环境配置、模型训练、模型服务和 AI 助手统一到一个前后端分离的产品中。

当前仓库处于 0-1 规划和工程初始化阶段，最新 PRD 稳定版本已整理到 `docs/prd/V1.0 PRD.md`。

当前技术方向：前后端分离，前端 / 桌面端采用 React + Electron，业务后端采用 Python，AI 助手与智能编排部分采用 Python，数据库暂未确定。

## 文档入口

- [V1.0 PRD](<docs/prd/V1.0 PRD.md>)
- [0-1 开发规划](docs/planning/development-plan.md)
- [Vibe Coding 协作规范](docs/process/vibe-coding.md)
- [OpenSpec 工作流](docs/development/openspec-workflow.md)
- [Codex Agent 工作协议](AGENTS.md)
- [仓库结构说明](docs/architecture/repository-structure.md)

## 仓库结构

```text
frontend/           React + Electron 桌面端代码
backend/            Python 后端、本地服务、任务执行器、数据/模型/环境检测
agent/              AI 助手、上下文组装、日志诊断、表单建议、动作请求
packages/shared/    前后端/智能体共用类型、枚举、工具方法
configs/            配置模板，例如日志、环境、Electron、后端配置
scripts/            启动、构建、测试、打包脚本
tests/              集成测试、端到端测试、验收用例
docs/               PRD、开发规范、架构文档
openspec/           Global Spec、Module Spec、OpenSpec Changes
```

## 协作原则

1. 所有功能同时支持用户点击入口和 AI 助手入口。
2. 所有需求变更先写 spec，再开发，再验证，再提交 git。
3. 每次功能修改必须留下文档记录和独立 git commit。
4. 三人协作默认按前端、后端/本地执行、AI/产品编排拆分职责。
