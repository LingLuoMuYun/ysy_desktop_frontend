# apps/frontend

React + Electron 桌面端代码目录。

职责：

- Electron 主进程、预加载脚本和窗口生命周期。
- React 渲染进程页面、状态管理和组件。
- 调用后端受控 API，不直接执行本机高风险动作。
- 承载首页、项目、任务、数据、模型、设置和 AI 助手界面。

初始化前要求：

- 先确认 Electron 构建、打包、自动更新和本机文件选择能力边界。
- 新增功能必须关联 `openspec/changes/<change-id>/`。
