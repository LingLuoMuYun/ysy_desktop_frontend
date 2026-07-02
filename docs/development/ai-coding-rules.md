# AI Coding 规则

本文件面向 Codex、Claude Code 等 AI Coding 工具，也面向使用 AI 协作的开发人员。AI 可以提高产出，但不能绕过 OpenSpec、Git 和验证流程。

## 必读顺序

AI 开始开发前必须按顺序读取：

1. `openspec/global/global.spec.md`
2. `openspec/modules/*.spec.md`
3. 当前 `openspec/changes/<change-id>/`
4. `AGENTS.md`
5. 相关代码文件、测试和 API 契约

本仓库已按 OpenSpec 体系重建，需求变更统一读取 `openspec/changes/`。

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

## 输出代码前检查

AI 输出或修改代码前必须检查：

- 当前需求对应的 OpenSpec Change 是否存在。
- 是否需要新增数据模型。
- 是否需要新增 API。
- 是否会影响 Project、Task、Dataset、ModelAsset、RuntimeEnvironment、AiAssistantModel。
- 是否会影响任务状态机。
- 是否涉及高风险操作。
- 是否涉及 AI `action_request`。
- 是否需要更新 Module Spec。
- 是否需要补充测试或验收记录。

## AI 可以修改

```text
frontend/
backend/
agent/
packages/shared/
tests/
openspec/changes/
docs/
```

## AI 不应直接修改

除非用户明确要求，AI 不应直接修改：

```text
openspec/global/
openspec/modules/
AGENTS.md
```

如果确实需要修改，必须说明原因、影响范围、验证方式和负责人确认点。

## AI 行为类型

AI 助手产品能力分为三类：

- `explain`：解释页面字段、状态、错误、日志和概念，不改变本机状态。
- `field_suggestion`：生成表单建议、参数建议或修复方案，由用户确认后提交。
- `action_request`：请求执行创建项目、检测环境、启动训练、启动服务等真实动作，必须走后端受控工具和用户确认。

AI Coding 工具开发这些能力时，也必须保持同样边界：AI 不能把建议直接变成绕过 UI / 后端确认的本机动作。

## 高风险操作

以下操作必须保留用户确认：

- 删除文件、数据集、模型权重或训练产物。
- 覆盖已有配置或环境。
- 安装、卸载或升级大量依赖。
- 修改系统级 Python、CUDA、Docker、WSL 配置。
- 启动长时间训练任务。
- 暴露本地服务端口。
- 上传用户数据到外部服务。

## 完成定义

AI 完成一个可交付修改必须满足：

- OpenSpec Change 已创建或更新。
- 代码或文档修改已完成。
- 必要测试或人工验证已运行。
- 验收记录已更新。
- git commit 已提交。
- 最终回复说明修改文件、验证结果、commit 和待确认事项。
