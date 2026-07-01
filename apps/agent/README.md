# apps/agent

AI 助手与智能编排目录。

职责：

- Intent Router：识别用户意图。
- Context Provider：读取页面、项目、任务、日志和环境上下文。
- Tool Registry：注册后端受控工具。
- Execution Plan：生成可展示、可审计的执行步骤。
- Guardrail：处理高风险动作确认、脱敏和禁止行为。

AI 助手不能绕过 `apps/backend/` 直接执行本机高风险操作。
