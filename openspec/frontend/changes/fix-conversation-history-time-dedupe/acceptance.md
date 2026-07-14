# 验收记录

## 已验证

- 2026-07-14：在 `frontend/` 运行 `pnpm run typecheck`，`tsc -b` 通过。
- 2026-07-14：联调 `GET /api/sessions`，确认后端返回 `updated_at: "2026-07-14T03:54:04.355089"` 这类无时区 ISO 字符串；该时间与前端 `Date.now()` 会话 id 对应的 UTC 时间一致，缺少 `Z` / `+08:00` 会导致前端按本地 03:54 展示。
- 2026-07-14：重新生成最新回答后，前端使用本次生成完成时刻更新会话 `updatedAt`，并只刷新最新助手回答的展示时间；再次运行 `pnpm run typecheck` 通过。
- 2026-07-14：重新生成候选版本映射时，前端按候选 `id` 或文本保留已有候选时间，新候选使用本次生成完成时间；候选切换控件展示当前候选时间。再次运行 `pnpm run typecheck` 通过。
- 2026-07-14：联调 `GET /api/sessions/runtime:home-conversation-1783999904736-rwmula`，确认候选版本的 `_process_events[-1].timestamp` 分别记录真实生成结束时间；前端已改为从会话详情保留 user `timestamp` 和 assistant `_process_events` 时间。再次运行 `pnpm run typecheck` 通过。

## 未验证

- 未启动 Electron / Vite 做浏览器或桌面端手工验证。
- 未在真实桌面 UI 中复验历史列表刷新后的展示。
- 未用真实 UI 复验重新生成后的消息时间显示。
- 未用真实 UI 复验多个候选版本切换后的候选时间显示。

## 待确认

- 建议后端把 sessions 时间改为带时区的 ISO 8601，例如 `2026-07-14T03:54:04.355089Z` 或 `2026-07-14T11:54:04.355089+08:00`。
- 会话详情接口当前 user 有 `timestamp`，assistant 可从 `_process_events` 推导候选时间；建议后端后续提供稳定的顶层消息/候选时间字段，避免前端依赖内部事件数组。
