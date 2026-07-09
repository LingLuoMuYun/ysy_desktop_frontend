# 仓库结构说明

桌面智算采用面向产品模块和工程职责的目录结构。代码按系统模块组织，OpenSpec Change 按需求组织，Git 分支负责把二者绑定到一次可审查变更中。

## 顶层目录

| 目录 | 作用 |
| --- | --- |
| `README.md` | 项目说明、启动入口、开发说明索引 |
| `AGENTS.md` | 给 Codex / Claude Code 等 AI Coding 工具读取的规则 |
| `docs/prd/` | 存放 PRD 稳定版本 |
| `docs/development/` | Git 规范、OpenSpec 规范、PR 规范、AI Coding 规范 |
| `docs/architecture/` | 系统架构、模块边界、技术方案 |
| `openspec/README.md` | OpenSpec 目录入口、阅读顺序和 Change 约定 |
| `openspec/frontend/global/` | Global Spec，定义当前系统边界和全局规则 |
| `openspec/frontend/modules/` | Module Spec，定义前端、后端、智能体模块规则 |
| `openspec/frontend/changes/` | 前端需求对应的 OpenSpec Change |
| `openspec/changes/` | 跨模块或当前活跃顶层 OpenSpec Change |
| `frontend/` | React + Electron 桌面端代码 |
| `backend/` | Python 后端、本地服务、任务执行器、数据/模型/环境检测 |
| `agent/` | AI 助手、上下文组装、日志诊断、表单建议、动作请求 |
| `packages/shared/` | 前后端/智能体共用类型、枚举、工具方法，前期可为空 |
| `scripts/` | 启动、构建、测试、打包脚本 |
| `tests/` | 集成测试、端到端测试、验收用例 |
| `configs/` | 配置模板，例如日志、环境、Electron、后端配置 |

## 组织原则

- 产品代码只进入 `frontend/`、`backend/`、`agent/` 和 `packages/`。
- 文档和需求治理进入 `docs/` 与 `openspec/`。
- 脚本进入 `scripts/`，不要散落到各模块根目录之外。
- 配置模板进入 `configs/`，本机私有配置不得提交。
- 测试按集成、端到端、验收维度进入 `tests/`。

## 模块级 AGENTS

根目录 `AGENTS.md` 只定义全局协作协议。后续模块实现细则分别由 `frontend/AGENTS.md`、`backend/AGENTS.md`、`agent/AGENTS.md` 维护。
