# 验收记录

## 已验证

- `pnpm run typecheck`：通过。

## 结果

- 首页发送消息不再固定使用 `conversation_id: "default"`。
- HomePage 接收 AppShell 当前会话 id，并将其传给 `/api/chat/stream`。
- 点击“新对话”生成的新会话 id 会随请求发送给后端。

## 未验证

- 未连接真实后端抓包验证请求体。
- 未启动 Electron 进行端到端手工验证。
