# Acceptance: stack-go-python-ai

## 验收环境

- 日期：2026-05-18
- 分支：main
- commit：`docs(stack): set go backend and python ai assistant`
- 操作系统：Windows

## 验收用例

- [x] README 说明当前技术方向
- [x] 开发规划不再建议 Python FastAPI 作为业务后端
- [x] 开发规划说明 Go 后端、Python AI 助手、数据库待定
- [x] AGENTS 说明 Codex agent 后续应按 Go/Python 边界开发
- [x] vibe coding 协作职责已更新

## 测试结果

```text
文档变更。已执行 git diff --cached --check。
```

## 遗留问题

- 需要在 M0 阶段确认具体 Go HTTP 框架
- 需要在 M0 阶段确认数据库选型
- 需要在 M0 阶段确认 Go 与 Python AI 助手之间的通信方式
