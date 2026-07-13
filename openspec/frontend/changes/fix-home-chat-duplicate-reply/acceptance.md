# 验收记录

## 验收项

- 后端按增量返回 `delta.content` 时，前端仍逐段追加展示。
- 后端按累计文本返回 `delta.content` 时，前端只追加新增部分。
- 后端重复发送相同 `delta.content` 时，前端不重复显示。
- `done.reply` 与本地草稿不一致时，首页最终展示以 `done.reply` 为准。
- TypeScript 检查通过。

## 结果

- 已在 `chatApi.sendMessage` 中增加流式文本归一化：后端若返回累计文本，只把新增部分传给页面；后端若重复发送同一 `sequence` 的 delta，则忽略重复事件。
- 已在 `HomePage` 中使用 `chatApi.sendMessage` 返回的最终 `reply` 覆盖 assistant 草稿，符合文档中“本地增量内容与 `done.reply` 不一致时，以 `done.reply` 为准”的规则。
- `node_modules\.bin\tsc.cmd -b` 通过。

## 未验证

- 未启动 Vite / Electron 做真实对话联调验证。
