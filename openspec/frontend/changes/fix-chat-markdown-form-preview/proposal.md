# 修复聊天 Markdown 表单误判

## 背景

首页和右侧 AI 助手对 Markdown 回复提供只读表单草稿预览能力。当前启发式规则会把普通说明文本中的加粗小标题误判为表单字段，导致类似“Python vs Java 对比”的回答被渲染成空输入框，看不到正文内容。

## 目标

- 普通 Markdown 说明、对比和列表必须按 Markdown 正常渲染。
- 只有明确包含表单、草稿、登记、申请等意图的内容才展示只读表单预览。
- 保留 JSON / schema 代码块表单预览能力。

## 非目标

- 不调整后端聊天接口。
- 不新增 Markdown 编辑器或富文本能力。
- 不改变 AI 回复内容生成逻辑。

## 影响范围

- `frontend/src/components/MarkdownRenderer.tsx`
- `frontend/src/styles/globals.css`（如需样式微调）

## 风险

低风险。该变更只影响前端消息渲染判断，不执行本机高风险动作，不修改本地文件数据。
