# Home Chat Spec Delta

## ADDED Requirements

### Requirement: 流式对话不得重复输出

首页和右侧 AI 助手在处理 `/api/chat/stream` 时，必须把 `delta` 事件和 `done.reply` 区分处理，最终消息只能展示一份 AI 回复。

#### Scenario: done 返回完整回复

- **Given** 后端先返回多个 `delta` 文本片段
- **And** 最后返回包含完整回复的 `done.reply`
- **When** 前端完成本轮流式处理
- **Then** assistant 消息内容等于完整回复
- **And** 不会把 `done.reply` 追加成第二份回复

#### Scenario: delta 返回累计快照

- **Given** 后端依次返回 `delta.content` 为 `你`、`你好`、`你好呀`
- **When** 前端展示流式内容
- **Then** assistant 消息最终为 `你好呀`
- **And** 不会展示为 `你你好你好呀`

### Requirement: 流式输出应具备打字机展示

首页和右侧 AI 助手在收到文本 delta 后，必须通过前端缓冲逐步展示内容；当流式完成、失败或组件卸载时，必须 flush 或清理缓冲，避免丢字或串入下一轮对话。

#### Scenario: 流式完成

- **Given** 打字机缓冲中仍有未展示字符
- **When** 收到 `done.ok=true`
- **Then** 前端立即 flush 剩余字符
- **And** 使用服务层返回的最终回复校准当前 assistant 消息
