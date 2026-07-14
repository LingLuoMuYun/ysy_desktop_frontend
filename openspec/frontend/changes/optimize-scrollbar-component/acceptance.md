# 验收记录

## 2026-07-14

已完成：

- 新增 `frontend/src/components/ScrollArea.tsx`，支持纵向、横向和双向滚动，以及稳定滚动槽位。
- 新增 `ScrollArea.css`，统一 Firefox / WebKit 滚动条颜色、宽度、圆角和 hover 态；样式支持读取全局 token，并提供默认值。
- 已接入首页消息列表、右侧 AI 助手消息列表、AI 助手历史列表、项目/任务/数据/模型列表。
- 根据视觉反馈隐藏 WebKit 滚动条上下箭头按钮，默认滚动条宽度调整为 8px，并优化 thumb 留白和 hover 颜色。
- 继续优化滚动块圆滑度：默认宽度调整为 7px，降低默认颜色不透明度，减少透明边框并增加轻微内阴影与 hover 过渡。

验证：

- `pnpm run typecheck` 通过，实际执行 `tsc -b` 成功。
- 命令过程中 pnpm 联网检查自身版本更新失败：`GET https://registry.npmjs.org/pnpm: fetch failed`；该提示不影响 TypeScript 验证结果。
- 本次样式微调后再次运行 `pnpm run typecheck` 未通过；当前错误位于既有未提交改动 `frontend/src/layouts/AppShell.tsx`，`cloneElement` 注入了类型未声明的 `onEditLatestUserMessage`。该错误与 `ScrollArea.css` 样式调整无直接关系。

未验证：

- 未启动 Vite / Electron 进行视觉截图检查。

## 2026-07-14 追加圆角优化

已完成：

- 在 `frontend/src/styles/tokens.css` 增加 `--radius-xs/sm/lg/xl/pill` 与滚动条颜色、尺寸、圆角 token。
- 将全局 WebKit 滚动条改为 token 驱动，轨道和滑块均通过 `border-radius: var(--scrollbar-radius)` 呈现圆角，并保留 hover / active 反馈。
- 将 `ScrollArea.css` 的滚动条轨道、滑块圆角统一到 `--scrollbar-radius`，补齐轨道留白、`background-clip` 和 active 态。

验证：

- `pnpm run typecheck` 通过，实际执行 `tsc -b` 成功。

未验证：

- 未启动 Vite / Electron 进行浏览器或桌面端视觉截图检查。

## 2026-07-14 修复 Chromium 圆角未生效

已完成：

- 将 `scrollbar-width` / `scrollbar-color` 限定在 Firefox 专用 `@supports (-moz-appearance: none)` 中，避免新版 Chromium/Electron 使用标准滚动条属性覆盖 `::-webkit-scrollbar` 圆角样式。
- 保留 WebKit 轨道和滑块的 `border-radius`、透明边框和 hover / active 反馈。

验证：

- `pnpm run typecheck` 通过，实际执行 `tsc -b` 成功。

未验证：

- 未启动 Vite / Electron 进行视觉截图复核。
