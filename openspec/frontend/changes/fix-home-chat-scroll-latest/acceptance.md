# 验收记录

## 验收项

- 首页存在历史消息时，进入首页后默认看到最新下方回复。
- 切换到已有历史对话后，消息区定位到最新消息。
- AI 回复流式更新时，消息区持续跟随最新内容。
- `pnpm run typecheck` 通过。

## 结果

- 已在 `HomePage` 消息列表末尾增加底部锚点；进入已有首页对话、切换历史会话或最新消息文本变化时，会调用 `scrollIntoView` 定位到消息底部。
- `node_modules\.bin\tsc.cmd -b` 通过。

## 未验证

- `pnpm run typecheck` 未进入 TypeScript 检查阶段：pnpm 因当前 `node_modules` 状态要求交互确认清理而退出，未执行依赖清理。
- 未启动 Vite / Electron 做浏览器或桌面端视觉验证。
