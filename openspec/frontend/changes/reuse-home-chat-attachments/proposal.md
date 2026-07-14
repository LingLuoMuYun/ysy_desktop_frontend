# 侧栏 AI 对话复用首页附件能力

## 背景

首页 AI 对话已经接入本机附件选择器、文件夹选择、附件类型图标和附件打开能力。右侧 AI 对话侧栏复用了同一个 `PromptToolbar`，但未传入附件选择回调，也未展示已选附件和消息附件，导致侧栏点击“上传附件”没有实际效果。

## 目标

- 右侧 AI 对话侧栏点击“上传附件”时复用首页的本机附件选择能力。
- 侧栏发送消息时保留附件名称、路径和类型，并在共享会话消息中展示。
- 首页和侧栏共用附件图标、附件列表和消息附件展示逻辑。

## 非目标

- 不读取、复制或上传附件内容。
- 不改变后端聊天接口协议。
- 不新增 AI `action_request` 或高风险动作。

## 影响范围

- `frontend/src/components/ChatAttachments.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/layouts/AssistantPanel.tsx`
- `frontend/src/layouts/AssistantPanelContext.tsx`

## 验收标准

- 侧栏“上传附件”能调起与首页一致的本机附件选择器。
- 侧栏已选附件可展示、打开和移除。
- 侧栏发送后的用户消息显示附件标签，切回首页仍能看到同一消息附件。
- 首页附件展示和打开行为保持一致。
