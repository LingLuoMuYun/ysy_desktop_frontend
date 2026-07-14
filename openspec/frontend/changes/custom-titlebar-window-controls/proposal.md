# Custom Titlebar Window Controls

## 背景

当前 Windows Electron 窗口使用系统原生标题栏，页面内部也有统一顶部栏，界面上方出现两层栏位。目标是去掉系统标题栏，把窗口控制放入页面顶部栏，效果接近用户提供的 p2。

## 目标

- Windows 桌面壳去掉系统原生标题栏。
- 页面顶部栏作为窗口拖拽区域。
- 顶部栏右侧使用 Windows 原生最小化、最大化/还原、关闭按钮。
- 关闭按钮直接关闭当前窗口，Windows 下最后窗口关闭后退出应用。

## 非目标

- 不处理 macOS/Linux 标题栏差异。
- 不调整首页、项目、任务、数据、模型、设置业务流程。
- 不新增后端、AI 助手或本地高风险执行能力。

## 影响范围

- `frontend/electron/main/`
- `frontend/electron/preload/`
- `frontend/src/layouts/WindowTitleBar.tsx`
- `frontend/src/types/ysyDesktop.d.ts`
- `frontend/src/styles/`

## 验收标准

- Windows Electron 窗口不再显示系统原生标题栏。
- 页面顶部栏空白区域可拖动窗口。
- 顶部栏按钮、输入框、下拉等交互区域不被拖拽区域拦截。
- Windows 原生最小化、最大化/还原、关闭按钮可用。
- `pnpm run typecheck` 通过，或记录与本次变更无关的既有错误。
