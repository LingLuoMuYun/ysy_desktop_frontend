# 修复首页 AI 对话会话 ID

## 背景

首页点击“新对话”后，前端会创建新的本地会话，但发送 `/api/chat/stream` 时仍固定传入 `conversation_id: "default"`。后端按 `conversation_id + channel` 持久化会话，导致多个新对话实际落到同一个后端会话中，AI 会持续读取旧上下文。

## 目标

- 首页每个新对话使用独立的后端 `conversation_id`。
- 历史栏选中的当前会话与后端请求会话保持一致。
- 不改变后端接口，不新增一级模块，不接入完整 sessions 持久化列表。

## 非目标

- 不实现 `GET /api/sessions` 历史会话持久化接入。
- 不改右侧 AI 助手面板的布局和历史列表交互。
- 不修改后端 `conversation_id` 默认值规则。

## 影响范围

- `frontend/src/layouts/AppShell.tsx`
- `frontend/src/pages/HomePage.tsx`

## 验收标准

- 首页发送消息时，请求体中的 `conversation_id` 使用当前 `activeHomeConversation.id`。
- 点击“新对话”后再次发送消息，请求体中的 `conversation_id` 与上一轮不同。
- 切换历史会话后继续发送消息，请求体使用被选中的会话 id。
- TypeScript 类型检查通过。
