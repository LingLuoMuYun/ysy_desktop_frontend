# 验收记录

## 2026-07-14

- 已修复：普通说明或对比类 Markdown 不再仅因包含多个加粗小标题就被转换为只读表单草稿。
- 已保留：明确表单标题、选项控件或 JSON/schema 代码块仍可进入只读表单预览。
- 已验证：`pnpm run typecheck` 通过。
- 已验证：`pnpm run build` 通过；首次沙箱内执行因 Vite/esbuild 子进程 `spawn EPERM` 失败，非沙箱授权后构建通过。
- 未验证：未启动 Vite / Electron 做浏览器或桌面视觉验证，避免未经确认暴露本地开发端口。
