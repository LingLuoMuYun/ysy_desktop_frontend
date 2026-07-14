# Acceptance: reuse-home-chat-attachments

## 2026-07-14

- 已抽取共享附件组件，首页和侧栏复用同一套附件类型识别、标签展示和打开逻辑。
- 已让侧栏 `PromptToolbar` 接入 `onAttachmentsSelected` 与浏览器 fallback `onFilesSelected`。
- 已让侧栏发送用户消息时把附件写入共享会话消息；首页和侧栏切换时可展示同一附件列表。

## 验证

- 已运行 `pnpm run typecheck`，TypeScript 检查通过。

## 未验证

- 未启动 Vite / Electron 做真实本机文件选择器和视觉截图复验。
