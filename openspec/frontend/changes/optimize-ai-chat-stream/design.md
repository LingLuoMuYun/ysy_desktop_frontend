# 设计说明

## 问题分析

现有前端存在三类重复输出风险：

1. 服务层将所有 `delta.content` 直接拼接，如果后端 `delta` 实际是累计文本快照，会得到 `你你好你好呀` 这类重复结果。
2. `done.reply` 是最终完整回复，不能作为新的增量再次追加；它只能用于校准最终文本。
3. 首页 `HomePage` 在 `sendMessage` 完成后忽略返回的 `result.reply`，导致服务层即便校准了最终文本，首页仍可能保留 UI 层的错误累加结果。

参考 `C:\Users\idr\Downloads\index.html` 的实现，流式 UI 应维护当前 assistant 草稿，并在 `done` 事件只补齐缺失内容或采用最终文本，不把最终回复当作新 delta 追加。

## 实现方案

- 在 `chatApi` 增加流式文本合并函数：
  - 按 `sequence` 忽略回退或重复事件。
  - 当新内容以当前全文开头时，视为累计快照，只追加后缀。
  - 当当前全文已经以新内容结尾时，视为重复 delta，忽略。
  - `done.reply` 只用于最终校准：若当前全文为空或是 `done.reply` 的前缀，采用 `done.reply`；否则保留流式全文，避免把不一致的最终事件再次拼接。
- 新增 `useTypewriterStream` Hook：
  - `enqueue(text)` 把规范 delta 放入缓冲。
  - 定时按字符批量输出，形成打字机效果。
  - `flush()` 在 done/error/finally 时同步吐出剩余文本。
  - `reset()` 在新一轮对话开始前清理上一轮缓冲。
- 首页和右侧 AI 助手复用该 Hook，最终态统一使用 `result.reply` 校准文本。

## 接口变化

无后端接口变化。`chatApi.sendMessage` 保持既有参数兼容。

## 安全与边界

- 不解析自由文本为业务动作。
- 不新增文件系统、训练、环境或服务操作。
- 不输出 API Key、token 或环境变量。

## 路径差异记录

根 `AGENTS.md` 提到 `openspec/global/global.spec.md` 和 `openspec/modules/*.spec.md`，当前仓库实际不存在这两个路径。前端模块规范指向 `openspec/frontend/global/global.spec.md` 和 `openspec/frontend/modules/frontend.spec.md`，本次按实际前端 OpenSpec 入口执行。
