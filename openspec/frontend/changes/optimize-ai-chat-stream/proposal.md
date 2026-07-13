# optimize-ai-chat-stream

## 背景

用户在 AI 对话中观察到 AI 回复会重复输出两次。参考独立 `index.html` 聊天实现和现有智能体接口文档后，问题集中在前端对 `/api/chat/stream` 的流式事件处理：后端可能同时返回 `delta` 和 `done.reply`，也可能因运行时差异让 `delta` 表示累计快照而非纯增量。当前首页对话在最终态未使用服务层返回的规范回复，容易保留重复累加结果。

## 目标

- 修复首页和右侧 AI 助手在流式对话中的重复输出风险。
- 统一服务层对 `delta`、`done`、`error` 和未知事件的容错处理。
- 增加前端打字机缓冲效果，让流式输出平滑展示，并可在完成或失败时立即 flush。
- 保持 Markdown 完成后渲染、流式中纯文本展示的现有安全策略。

## 非目标

- 不新增或修改后端接口。
- 不接入编辑、重新生成、候选版本切换等新交互。
- 不修改 Global Spec 或 Module Spec。
- 不引入新的测试框架或 UI 组件库。

## 影响模块

- `frontend/src/services/chatApi.ts`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/layouts/AssistantPanelContext.tsx`
- `frontend/src/hooks/`

## 风险等级

低风险。修改仅影响 AI 对话展示和流式解析，不触发本机文件、环境、训练或服务等高风险动作。

## 验收标准

- 当后端逐段返回 `delta` 且 `done.reply` 返回完整文本时，界面只显示一份最终回复。
- 当后端误把 `delta` 返回为累计快照时，界面只追加新增部分。
- 当后端重复发送相同 `delta` 或 sequence 回退事件时，前端忽略重复片段。
- 首页与右侧 AI 助手均有平滑打字机展示；流式完成后立即展示完整最终文本。
- TypeScript 类型检查通过。
