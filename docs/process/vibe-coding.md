# Vibe Coding 协作规范

## 目标

本项目会大量使用 AI 辅助开发，但不能让代码和需求失控。所有 AI 生成内容都必须进入可审查、可测试、可回滚的工程流程。

## 基本流程

每次功能修改都按以下顺序执行：

1. 写需求变更 spec
2. 拆任务清单
3. 让 AI 生成或修改代码
4. 人审查关键设计和风险点
5. 运行测试、lint、类型检查
6. 更新文档或验收记录
7. git commit
8. 提交 PR 或合并到约定分支

没有 spec 的功能修改不进入主分支。没有 commit 的功能修改不算完成。

## AI 使用边界

AI 可以做：

- 根据 spec 生成代码
- 补测试
- 重构局部模块
- 解释错误日志
- 生成接口草案
- 生成验收用例
- 整理开发记录

AI 不应直接做：

- 未经确认删除用户文件
- 未经确认覆盖模型、数据集和训练产物
- 未经确认安装大量依赖
- 未经确认修改全局环境
- 绕过测试直接合并
- 在没有 spec 的情况下扩展功能边界

## 分支策略

推荐分支：

- `main`：稳定主分支
- `develop`：集成分支
- `feature/<change-id>`：功能分支
- `fix/<change-id>`：问题修复分支
- `docs/<change-id>`：文档分支

`change-id` 与 `openspec/changes/<change-id>/` 保持一致。

示例：

```text
feature/project-import
fix/env-cuda-detect
docs/v1-prd
```

## Commit 规范

提交格式：

```text
<type>(<scope>): <summary>
```

常用类型：

- `feat`：功能
- `fix`：修复
- `docs`：文档
- `refactor`：重构
- `test`：测试
- `chore`：工程维护
- `spec`：需求规格

示例：

```text
spec(project): add project import proposal
feat(project): implement local project scanner
test(project): cover scanner edge cases
docs(prd): convert V1 PRD to markdown
```

要求：

- 一个 commit 只表达一个清晰意图
- 功能代码和无关格式化不要混在同一个 commit
- 每次功能修改至少包含 spec commit 和 implementation commit
- commit message 必须能回溯到 change-id 或模块

## PR 规范

PR 描述必须包含：

- 关联 spec 路径
- 本次变更范围
- UI 入口
- AI 入口
- 测试结果
- 风险和回滚方式

PR 合并前检查：

- 需求是否有 spec
- UI 和 AI 两种入口是否都覆盖
- 是否更新 API 契约或数据模型文档
- 是否有必要测试
- 是否存在未解释的大规模改动

## 三人协作规则

默认职责：

- 前端负责人：页面、交互、状态管理、任务执行面板、AI 助手 UI
- 后端负责人：Python API、数据库抽象、本地环境、训练任务、服务管理
- AI/产品负责人：Python AI 助手服务、PRD、spec、AI 工具编排、验收用例、提示词和上下文设计

协作要求：

- 每个功能必须提前明确接口契约
- 前后端通过 mock 或契约并行开发
- 任何人修改公共数据模型、API、后端/AI 助手服务契约、任务状态枚举，都必须通知另外两人
- 每天下班前保证自己分支可提交，不能只留本地散乱修改

## 开发记录

每个 change-id 目录下需要保留：

- `proposal.md`：为什么做、做什么、不做什么
- `tasks.md`：任务拆分和完成状态
- `design.md`：必要时记录技术设计
- `acceptance.md`：验收记录和测试结果

当功能完成后，在 `tasks.md` 中标记完成，并在 PR 中链接该目录。
