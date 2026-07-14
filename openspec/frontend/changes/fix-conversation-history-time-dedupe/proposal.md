# 修复对话历史时间与重复当前对话

## 背景

首页对话历史已接入 `GET /api/sessions`，但前端只解析 `updated_at` / `created_at`，当后端返回 camelCase 字段、展示时间文案或数字时间戳时，历史列表会回退为当前时间或显示原始值，导致时间不准确。

同时，前端会先创建本地当前对话并在发送后进入历史列表；刷新服务端 sessions 后，同一会话可能同时保留本地记录和服务端记录，导致当前对话重复显示。

## 目标

- 历史会话时间兼容常见后端字段：`updated_at`、`updatedAt`、`updatedAtText`、`created_at`、`createdAt` 以及数字时间戳。
- 历史列表合并时按 `sessionKey` 和 `conversation_id` 去重，同一会话只展示一条。
- 保留本地未同步会话和空白当前会话的现有行为。

## 非目标

- 不修改后端接口。
- 不新增完整会话持久化 store。
- 不调整对话详情消息时间结构。

## 影响范围

- `frontend/src/services/chatApi.ts`
- `frontend/src/layouts/AppShell.tsx`

## 风险

低风险。仅调整前端会话接口适配和列表合并逻辑，不执行本地高风险动作。
