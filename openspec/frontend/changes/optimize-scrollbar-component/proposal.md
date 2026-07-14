# 优化前端滚动条组件

## 背景

前端多个页面和面板直接在业务容器上声明 `overflow: auto` 或 `overflow-y: auto`，滚动条视觉不统一，后续复用缺少单独组件入口。

## 目标

- 新增通用 `ScrollArea` 组件，供页面、布局和弹窗复用。
- 统一滚动条宽度、颜色、hover 态和稳定占位，组件样式可读取全局 token 并带默认值。
- 统一滚动条圆角 token，WebKit 滚动条轨道和滑块必须通过 `border-radius` 呈现圆角，并与 Firefox 标准滚动条颜色降级保持一致。
- 优先接入当前高频滚动区域：工作台列表、首页消息、AI 助手消息和 AI 助手历史列表。

## 非目标

- 不引入第三方滚动条库。
- 不改变业务数据、接口、状态机或 AI 行为。
- 不重构页面信息架构。

## 影响模块

- `frontend/src/components`
- `frontend/src/layouts`
- `frontend/src/pages`
- `frontend/src/styles`

## 风险等级

低风险。该变更只影响前端展示样式和滚动容器封装，不执行本机动作，不修改后端接口。

## 验收标准

- 项目内存在可复用的 `ScrollArea` 组件。
- 主要滚动区域使用统一滚动条样式。
- WebKit 内核下全局滚动条和 `ScrollArea` 滚动条的轨道、滑块显示圆角。
- 现有消息列表自动滚动到底部的行为保持可用。
- TypeScript 检查通过。
