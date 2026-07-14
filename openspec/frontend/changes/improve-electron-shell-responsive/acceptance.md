# Acceptance

## 验收记录

- 2026-07-13：运行 `pnpm run typecheck`，通过。
- 2026-07-13：静态检查 Electron 主窗口配置，`minWidth` 从 1100 降至 720，`minHeight` 从 640 降至 520，保留 `resizable: true`、`maximizable: true`。
- 2026-07-13：静态检查 AppShell 窄宽逻辑，宽度不高于 `960px` 时自动隐藏左侧导航、历史栏、右侧 AI 助手/资源栏和右栏拖拽条。

## 未验证

- 未启动 Electron 桌面窗口做最大化按钮和拖拽缩放的手动验证。

## 待确认

- 自动收起阈值暂定为 `960px`，如需更早或更晚收起可继续调整。
