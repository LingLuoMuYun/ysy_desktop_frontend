# 任务清单

- [x] 阅读前端 AGENTS、PRD、OpenSpec 工作流、Global Spec、Frontend Module Spec 和聊天相关代码。
- [x] 创建 OpenSpec Change 并记录问题分析、方案和验收标准。
- [x] 修复 `chatApi` 流式事件合并与最终回复校准逻辑。
- [x] 为首页与右侧 AI 助手增加可 flush 的打字机缓冲。
- [x] 运行 TypeScript 类型检查。
- [x] 更新验收记录。
- [x] 提交 git commit。

## 验收记录

- 2026-07-13：执行 `pnpm run typecheck`，通过。
- 2026-07-13：复查 `chatApi` 流式事件处理，`delta` 只向 UI 派发规范化后的新增文本，`done.reply` 作为最终权威文本校准，避免最终回复被追加第二次。
- 2026-07-13：复查首页与右侧助手均使用 `useTypewriterStream`，新一轮开始前 reset，完成或失败时 flush，避免缓冲文本串入下一轮。
- 2026-07-13：提交 `fix(frontend): optimize ai chat streaming output`。
