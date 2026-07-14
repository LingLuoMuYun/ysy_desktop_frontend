# 修复智能体会话接口适配

## 背景

智能体接口文档中，对话、会话和运行模型接口使用 `ok` / `type` 风格响应；前端部分适配仍按设置页通用 `success/data` 响应解析，导致 `/api/sessions`、`/api/sessions/{session_key}`、`DELETE /api/sessions/{session_key}` 等接口无法正确消费。

同时，流式对话中的 `error` 事件未被显式处理，模型切换 UI 只更新前端状态，未真正调用 `/api/runtime/model`。

## 目标

- 会话列表、会话详情、删除会话按智能体接口文档的 `ok` 响应解析。
- 首页历史栏接入 workspace sessions，打开历史时可加载真实会话列表、恢复会话消息并删除会话。
- 流式对话显式处理 `error` 事件，避免失败被吞掉。
- 修正编辑最新消息、重新生成、候选回答切换和停止生成的服务层接口入口。
- 模型切换调用 `/api/runtime/model`，失败时回退前端当前模型。

## 非目标

- 不接入完整历史会话 UI 持久化。
- 不实现候选回答切换 UI。
- 不新增 Plan / Skills 后端接口。
- 不修改后端接口契约。

## 影响范围

- `frontend/src/services/chatApi.ts`
- `frontend/src/layouts/AssistantPanelContext.tsx`
- `frontend/src/layouts/AppShell.tsx`
- `frontend/src/layouts/ConversationHistoryPanel.tsx`
- `frontend/src/layouts/conversationTypes.ts`
- `frontend/src/styles/globals.css`

## 风险

低风险。该变更只调整前端 API 适配和错误处理，不执行本机高风险动作，不上传本地数据。
