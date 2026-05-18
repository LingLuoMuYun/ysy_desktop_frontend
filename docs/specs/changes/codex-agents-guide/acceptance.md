# Acceptance: codex-agents-guide

## 验收环境

- 日期：2026-05-18
- 分支：main
- commit：`docs(agent): add codex development guide`
- 操作系统：Windows

## 验收用例

- [x] 根目录存在 `AGENTS.md`
- [x] `AGENTS.md` 覆盖 Codex agent 工作流
- [x] `AGENTS.md` 覆盖 spec、git、测试和安全边界
- [x] README 包含 Agent 工作协议入口
- [x] 本次变更有 spec 记录

## 测试结果

```text
文档变更。已执行 git diff --cached --check。
```

## 遗留问题

- 团队可以在工程初始化后补充前端、后端、AI 编排子目录级 `AGENTS.md`
