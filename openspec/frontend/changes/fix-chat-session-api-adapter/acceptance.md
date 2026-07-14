# 验收记录

## 已验证

- 2026-07-14：在 `frontend/` 运行 `pnpm run typecheck`，`tsc -b` 通过；接入历史会话 UI 持久化后复跑仍通过。
- 2026-07-14：真实 runtime `http://10.0.1.5:8765` 联调 `GET /api/sessions` 通过，返回 `ok: true` 和真实 sessions 列表。
- 2026-07-14：真实 runtime 联调 `POST /api/runtime/model` 通过，默认模型 `model_97cfbadd6177461086e99e7c1069bdd7` 返回 `ok: true`。
- 2026-07-14：真实 runtime 联调 `POST /api/chat/stream` 通过，测试会话 `codex-runtime-smoke-20260714` 返回 `reasoning`、`delta` 和 `done`。
- 2026-07-14：真实 runtime 联调 `GET /api/sessions/runtime:codex-runtime-smoke-20260714` 通过，可读取会话消息。
- 2026-07-14：真实 runtime 联调 `DELETE /api/sessions/runtime:codex-runtime-smoke-20260714` 通过，测试会话已删除。
- 2026-07-14：删除历史会话确认从 `window.confirm` 改为项目内确认弹窗样式后，复跑 `pnpm run typecheck` 通过。
- 2026-07-14：添加编辑、重新生成、候选回答切换 UI 后，复跑 `pnpm run typecheck` 通过。
- 2026-07-14：真实 runtime 联调 `POST /api/chat/regenerate-latest` 和 `POST /api/chat/switch-candidate` 通过，测试会话 `codex-candidate-smoke-20260714` 已删除。
- 2026-07-14：真实 runtime 联调 `POST /api/chat/edit-latest` 通过，测试会话 `codex-edit-smoke-20260714` 已删除。
- 2026-07-14：候选回答版本切换改为左右箭头切换后，复跑 `pnpm run typecheck` 通过。

## 待验证

- 使用真实智能体 runtime 联调 `/api/chat/stream` 的 `error` 事件。
- 使用真实智能体 runtime 复验首页历史栏打开、恢复消息、删除会话后的 UI 状态。
- `POST /api/chat/cancel` 当前真实 runtime 返回 404 `{"detail":"Not Found"}`，需确认后端是否未开放或路径已变更。
- `GET /api/sessions` 和会话详情中的中文 `preview/content` 当前在命令行联调输出中出现乱码，需确认后端响应编码或存储编码。

## 说明

当前变更已完成前端静态适配和主要真实接口联调。停止生成接口和中文编码问题仍需团队确认。
