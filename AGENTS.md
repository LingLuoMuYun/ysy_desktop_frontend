# AGENTS.md

本文件是桌面智算项目的全局 AI 协作协议，供 Codex、Claude Code 等 AI Coding 工具读取。它只规定项目级背景、协作流程和安全边界；具体前端、后端、智能体实现要求由各模块目录下的 `AGENTS.md` 维护。

## 项目背景

项目名称：衍生云桌面智算 / 桌面智算。

产品定位：面向个人电脑、本地工作站和小型实验环境的本机 AI 训练、推理与资产管理工作台，管理项目、任务、数据、模型、运行环境、推理服务和 AI 辅助诊断。

核心模块：

- 首页
- 项目
- 任务
- 数据
- 模型
- 设置

技术方向：

- 前端 / 桌面端：React + Electron，模块目录为 `frontend/`。
- 后端 / 本地服务：Python，模块目录为 `backend/`。
- AI 助手 / 智能编排：Python，模块目录为 `agent/`。
- 共享类型、枚举和契约：`packages/shared/`。

## 指导文件层级

Agent 开始工作前必须按顺序读取：

1. 根目录 `AGENTS.md`
2. 当前模块的 `AGENTS.md`，例如 `frontend/AGENTS.md`、`backend/AGENTS.md`、`agent/AGENTS.md`
3. `openspec/global/global.spec.md`
4. `openspec/modules/*.spec.md`
5. 当前任务对应的 `openspec/changes/<change-id>/`
6. `README.md`
7. `docs/prd/V1.0 PRD.md`
8. `docs/development/*.md`
9. 相关代码、测试和 `packages/shared/`

如果模块级 `AGENTS.md` 尚不存在，按本文件、OpenSpec 和现有模块文档执行，不自行补充模块实现细则。

## 规则优先级

从高到低：

1. 用户本轮明确指令
2. `openspec/global/global.spec.md`
3. `openspec/modules/*.spec.md`
4. 当前 `openspec/changes/<change-id>/`
5. 当前模块 `AGENTS.md`
6. 根目录 `AGENTS.md`
7. `docs/development/*.md`
8. 代码实现和测试

如果低优先级内容与高优先级冲突，先指出冲突并说明建议处理方式；除非用户明确要求，否则不要静默覆盖既有规范。

## 工作流程

每个可交付变更按以下流程执行：

1. 检查仓库状态：`git status --short --branch`。
2. 阅读全局 AGENTS、模块 AGENTS、相关 OpenSpec、PRD、开发规范和代码。
3. 创建或更新 `openspec/changes/<change-id>/`。
4. 实现代码、文档或配置变更。
5. 运行必要验证，并把结果写入验收记录。
6. 提交 git commit。
7. 最终回复说明修改内容、关键文件、验证结果、commit 和仍需团队确认的事项。

纯文档小改也需要 commit。只有拼写、标点、格式这类极小修改可以不新增完整 OpenSpec Change。

## Git 规则

分支模型：

```text
main
  ↑
dev / dev1.0
  ↑
feature/*
```

基本要求：

- `main` 保存稳定代码和稳定 Spec 快照。
- `dev` 保存集成中的代码、Spec 和 OpenSpec Changes。
- `feature/*` 可以按人、模块或阶段划分，但 OpenSpec Change 必须按需求划分。
- 不把多个无关功能塞进一个 commit。
- 不提交未解释的大规模格式化。
- 不使用 `git reset --hard` 或强制回滚用户修改，除非用户明确要求。

提交格式：

```text
<type>(<scope>): <summary>
```

常用类型：`feat`、`fix`、`docs`、`spec`、`refactor`、`test`、`chore`。

## 目录约定

正式模块目录：

```text
frontend/
backend/
agent/
packages/shared/
```

需求变更目录：

```text
openspec/changes/<change-id>/
```

代码按模块组织，OpenSpec Change 按需求组织，Git 分支负责把代码变更和需求 Spec 绑定起来。

## 安全边界

必须让用户确认的操作：

- 删除文件、数据集、模型权重或训练产物。
- 覆盖已有配置或运行环境。
- 安装、卸载或升级大量依赖。
- 修改系统级 Python、CUDA、Docker、WSL 配置。
- 启动长时间训练任务。
- 暴露本地服务端口。
- 上传用户数据到外部服务。

默认禁止：

- 直接递归删除目录。
- 静默修改全局环境变量。
- 静默联网下载大文件。
- 明文展示 API Key、token、secret 或环境变量。
- 将本地路径、日志、数据集内容发送到外部服务，除非用户确认。

## AI 协作原则

- 不允许无 OpenSpec Change 修改功能代码。
- 不允许只改代码不更新对应 Change。
- 不允许只改 Change 不处理相关实现或验收说明。
- AI 不能绕过后端受控入口直接执行产品内高风险动作。
- 涉及架构、API、数据模型、任务状态、AI 工具或模块边界时，必须先更新对应 design 或接口文档。
- 具体代码风格、测试细则、框架约束和模块内实现规则，交给对应模块级 `AGENTS.md` 规定。

## 最终回复要求

Agent 完成任务后的回复应包含：

- 修改了什么。
- 关键文件路径。
- 验证结果。
- git commit。
- 仍需团队确认的事项。

回复要简洁，不要长篇复述代码。
