# Acceptance

- 2026-07-14：已将 Windows Electron 主窗口配置为无系统标题栏，非 Windows 平台保持原生标题栏配置不变。
- 2026-07-14：已改用 Electron `titleBarOverlay` 提供 Windows 原生最小化、最大化/还原、关闭按钮。
- 2026-07-14：已移除页面内自绘窗口控制按钮和对应 IPC 暴露。
- 2026-07-14：已新增 `windowControls.css`，顶部栏空白区域可拖动，顶部栏内按钮和交互控件保持不可拖拽，并为原生窗口控制区预留右侧空间。
- 2026-07-14：已运行 `pnpm run typecheck`，结果通过。

## 未验证

- 未启动 Electron 窗口做人工视觉核对。
