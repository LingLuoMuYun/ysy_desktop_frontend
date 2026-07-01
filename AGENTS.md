# AGENTS.md

本文件是桌面智算项目所有 Codex、Claude Code 等 AI Coding agent 的工作协议。任何参与本项目开发、重构、测试、文档整理或 PR 修复的 agent，都必须先阅读并遵守本文件。

## 项目背景

项目名称：衍生云桌面智算 / 桌面智算

产品定位：面向个人电脑、本地工作站和小型实验环境的本机 AI 训练、推理与资产管理工作台，管理项目、任务、数据、模型、运行环境、推理服务和 AI 辅助诊断。

核心模块：

- 首页
- 项目
- 任务
- 数据
- 模型
- 设置

核心原则：

- 所有核心功能必须同时提供 UI 点击入口和 AI 助手入口。
- AI 助手不是聊天框，而是项目、环境、训练、服务、诊断和分析的操作中枢。
- 前端 / 桌面端采用 React + Electron。
- 后端和智能体能力均以 Python 为主。
- OpenSpec 是需求变更与 AI Coding 的规范体系。
- AGENTS.md 是 AI Coding 工具读取的行为规则，不是 PRD，也不是 Global Spec。
- Git 分支负责把代码变更、OpenSpec Change、验证结果和 commit 绑定起来。

## 必读文档顺序

Agent 开始工作前必须按顺序读取：

1. `openspec/global/global.spec.md`
2. `openspec/modules/*.spec.md`
3. 当前任务对应的 `openspec/changes/<change-id>/`
4. `README.md`
5. `docs/prd/V1.md`
6. `docs/planning/development-plan.md`
7. `docs/development/openspec-workflow.md`
8. `docs/development/git-workflow.md`
9. `docs/development/ai-coding-rules.md`
10. 相关代码文件、测试和 `packages/shared/`

当前仓库仍保留历史 `docs/specs/changes/`。处理历史需求或已有变更时，也必须读取对应目录。

## 规则优先级

从高到低：

1. 用户本轮明确指令。
2. `openspec/global/global.spec.md`
3. `openspec/modules/*.spec.md`
4. 当前 `openspec/changes/<change-id>/`
5. `AGENTS.md`
6. `docs/development/*.md`
7. 代码实现和测试

如果低优先级内容与高优先级冲突，先指出冲突并说明建议处理方式；除非用户明确要求，否则不要静默覆盖既有规范。

## 工作总原则

1. 先读上下文，再动手。
2. 先确认需求边界，再写代码。
3. 先写或更新 OpenSpec Change，再开发功能。
4. 代码、文档、测试和 git 记录必须能互相追踪。
5. 不扩大需求范围，不顺手做无关重构。
6. 不删除或回滚用户已有修改，除非用户明确要求。
7. 每次完成可交付修改后都要提交 git。

## 标准工作流

每个功能变更按以下流程执行：

1. 检查仓库状态：`git status --short --branch`
2. 阅读 Global Spec、相关 Module Spec、当前 PRD、既有 Change 和相关代码。
3. 在 `openspec/changes/<change-id>/` 创建或更新变更记录。
4. 编写或更新：
   - `proposal.md`
   - `tasks.md`
   - `design.md`，仅在涉及架构、API、数据模型、状态机、AI 工具或复杂流程时必需
   - 验收记录，位置可在 Change 内或团队约定文件中
5. 实现代码或文档变更。
6. 运行必要验证。
7. 更新验收结果和任务清单。
8. 提交 git。
9. 在最终回复中说明变更文件、验证结果、commit 和仍需团队确认的事项。

纯文档小改也需要 commit。只有拼写、标点、格式这类极小修改可以不新增完整 Spec，但仍要保证 git 记录清楚。

## Git 规范

分支模型：

```text
main
  ↑
dev / dev-v1.0 / dev1.0
  ↑
feature/*
```

`main`：

- 生产稳定分支。
- 只接收经过验证的稳定代码。
- 保存与当前稳定代码匹配的稳定 Spec 快照。
- 不允许直接开发，不允许直接提交。
- 只能通过 dev 合并进入。

`dev`：

- 开发集成分支。
- 存放当前集成代码、Global Spec、Module Spec、AGENTS.md 和开发中的 OpenSpec Changes。
- 所有 feature 分支从 dev 拉取并合并回 dev。
- 必须保持代码与 Spec 同步。

`feature/*`：

- 可以按人、模块或阶段划分，不强制每个需求一个分支。
- 分支可以按人或模块划分，但 OpenSpec Change 必须按需求划分。
- 不要在一个 feature 分支中积累过多未合并需求。

提交格式：

```text
<type>(<scope>): <summary>
```

常用类型：

- `feat`
- `fix`
- `docs`
- `spec`
- `refactor`
- `test`
- `chore`

禁止：

- 直接 push 到 `main`。
- 从 feature 分支直接合并到 `main`。
- 把多个无关功能塞进一个 commit。
- 用 `git reset --hard` 或强制回滚用户修改。
- 提交未解释的大规模格式化。
- 跳过验证后声称已完成。

## 代码目录、Spec 目录和分支名

分支名不是代码目录名。

核心原则：

```text
代码按模块组织；
Spec Change 按需求组织；
Git 分支负责把代码变更和需求 Spec 绑定起来。
```

当前仓库代码目录：

```text
apps/frontend/
apps/backend/
apps/agent/
packages/shared/
```

OpenSpec Change 目录：

```text
openspec/changes/<change-id>/
```

历史 Spec 目录：

```text
docs/specs/changes/<change-id>/
```

不要为了某个需求创建 `src/task-001/` 或 `src/feature-x/` 这类零散代码目录。

## AI 必须遵守的规则

- Global Spec 优先级最高。
- Module Spec 次之。
- OpenSpec Change 只能定义当前需求。
- 不能擅自修改系统边界。
- 不能新增一级模块。
- 不能绕过用户确认。
- 不能直接执行产品内的本机高风险命令。
- 不能明文展示 API Key、token、环境变量。
- 不能把本地大文件复制到项目目录。
- 不允许无 Spec 改代码。
- 不允许只改代码不改对应 Change。
- 不允许只改 Change 不改相关代码或验收说明。

## AI 输出代码前必须检查

- 当前需求对应的 OpenSpec Change 是否存在。
- 是否需要新增数据模型。
- 是否需要新增 API。
- 是否会影响 Project、Task、Dataset、ModelAsset、RuntimeEnvironment、AiAssistantModel。
- 是否会影响 Task / Dataset / ModelAsset / RuntimeEnvironment 状态机。
- 是否涉及高风险操作。
- 是否涉及 AI `action_request`。
- 是否需要更新 Module Spec。
- 是否需要补充测试或验收记录。

## AI 修改边界

AI 可以修改：

```text
apps/frontend/
apps/backend/
apps/agent/
packages/shared/
tests/
openspec/changes/
docs/specs/changes/
docs/
```

AI 不应直接修改，除非用户明确要求：

```text
openspec/global/
openspec/modules/
AGENTS.md
```

如果用户明确要求修改这些文件，必须说明影响范围、验证方式和仍需负责人确认的事项。

## 产品与安全边界

必须让用户确认的操作：

- 删除文件、数据集、模型权重或训练产物。
- 覆盖已有配置或环境。
- 安装、卸载或升级大量依赖。
- 修改系统级 Python、CUDA、Docker、WSL 配置。
- 启动长时间训练任务。
- 暴露本地服务端口。
- 上传用户数据到外部服务。

默认禁止：

- 直接递归删除目录。
- 静默修改全局环境变量。
- 静默联网下载大文件。
- 将本地路径、日志、数据集内容发送到外部服务，除非用户确认。

## 前端实现要求

- 页面应服务真实工作流，不做营销式落地页。
- 工作台类页面优先信息密度、可扫描性和稳定布局。
- 任务、环境、训练、服务等状态型功能必须提供清晰状态标签和错误信息。
- 复杂操作需要步骤条或任务面板，不只弹 toast。
- 高风险操作必须有确认入口。

## 后端实现要求

- API 返回结构必须稳定。
- 错误码和错误消息要可用于 UI 展示和 AI 诊断。
- 本地路径、环境、训练任务、服务进程都要持久化必要状态。
- 长任务必须可追踪、可取消、可查看日志。
- 文件扫描必须限制范围，避免无边界扫描整盘。
- Python 后端负责业务 API、本地执行、任务状态、日志采集和服务进程管理。

## AI 助手实现要求

AI 助手行为分为：

- `explain`：解释字段、状态、日志和错误。
- `field_suggestion`：生成表单建议或参数建议。
- `action_request`：请求执行真实动作，必须走后端受控工具和用户确认。

AI 助手输出不能只是一段文字。涉及操作时必须形成结构化执行计划：

```text
任务：创建 YOLOv8 项目
步骤：
1. 检查代码目录
2. 检查数据集目录
3. 检测 Python 和 CUDA
4. 推荐运行环境
5. 等待用户确认
6. 创建项目档案
7. 给出下一步建议
```

## 测试与验收

最低要求：

- 文档变更：检查链接、路径和格式。
- 前端变更：运行 lint/typecheck，必要时用浏览器检查关键页面。
- Python 后端变更：运行 Python 单元测试或接口测试。
- Python AI 编排变更：至少覆盖成功、缺参、失败三类场景。
- 数据模型变更：验证迁移和回滚路径。

最终回复必须说明哪些验证已运行，哪些没有运行以及原因。

## PR 规范

PR 必须包含：

1. 关联的 OpenSpec Change
2. 影响范围
3. 修改了哪些代码模块
4. 是否修改了 Global Spec
5. 是否修改了 Module Spec
6. 是否新增 API
7. 是否新增数据字段
8. 是否新增状态机状态
9. 是否涉及 AI 行为
10. 是否涉及高风险操作
11. 测试说明
12. 回滚方式

合并到 dev 前必须检查：

- 是否违反 Global Spec。
- 是否违反 Module Spec。
- 是否绕过用户确认。
- 是否让 AI 直接执行高风险动作。
- 是否新增未登记状态、字段或 API。
- 是否有测试。
- Spec 和代码是否同步。

## 三人协作方式

默认角色：

- 前端负责人：页面、交互、状态管理、任务面板、AI 助手 UI。
- 后端负责人：Python API、数据库抽象、本地环境、训练任务、日志和服务管理。
- AI/产品负责人：Python AI 助手服务、PRD、OpenSpec、AI 工具编排、上下文、验收用例。

协作规则：

- 公共 API、数据模型、任务状态枚举变更前，先更新 design 或接口文档。
- 后端与 AI 助手契约、公共 API 或其他语言扩展边界变更前，先更新 design 或接口文档。
- 前后端可以基于 mock 并行，但最终必须用真实 API 联调。
- 任何人发现 Spec 与实现不一致，应先修正文档或提出变更，不要让差异继续扩大。

## Agent 回复规范

Agent 完成任务后的回复应包含：

- 修改了什么。
- 关键文件路径。
- 验证结果。
- git commit。
- 仍需团队确认的事项。

回复要简洁，不要长篇复述代码。
