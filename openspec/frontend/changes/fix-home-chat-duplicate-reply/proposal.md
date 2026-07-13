# 修复首页 AI 对话重复拼接回复

## 背景

首页 AI 对话中，用户发送“你好”后，assistant 气泡内出现同一段回复重复两次。根据 `frontend/docs/AI对话与智能体接口替换详解.md`，`delta.content` 应追加到当前 assistant 草稿，`done.reply` 是当前轮最终回复；若本地增量内容与 `done.reply` 不一致，应以 `done.reply` 为准。

当前实现无条件累加每个 `delta.content`，且首页最终渲染仍使用局部累加的 `replyText`，没有使用 `chatApi.sendMessage` 返回的最终 `reply` 覆盖草稿。当后端实际返回的 `delta.content` 偏向“累计文本”或重复片段时，前端会把同一回答拼接两次。

## 目标

- 在聊天流适配层对 `delta.content` 做去重和累计文本兼容，避免同一片段重复追加。
- 首页在收到 `done` 后使用 `sendMessage` 返回的最终 `reply` 覆盖 assistant 草稿。
- 保持现有接口地址、请求参数和页面结构不变。

## 非目标

- 不修改智能体后端接口契约。
- 不新增停止生成、重新生成或候选版本 UI。
- 不调整会话历史持久化。

## 影响范围

- `frontend/src/services/chatApi.ts`
- `frontend/src/pages/HomePage.tsx`

## 风险等级

低风险。该变更仅影响前端流式文本合并和最终回复落盘，不执行本机动作，不修改 API、IPC、数据模型或高风险确认流程。

## 验收标准

- 后端按增量返回 `delta.content` 时，前端仍逐段追加展示。
- 后端按累计文本返回 `delta.content` 时，前端只追加新增部分。
- 后端重复发送相同 `delta.content` 时，前端不重复显示。
- `done.reply` 与本地草稿不一致时，首页最终展示以 `done.reply` 为准。
- TypeScript 检查通过。
