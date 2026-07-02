# Acceptance: simplify-global-agents

## 验收环境

- 日期：2026-07-02
- 分支：main
- 操作系统：Windows

## 验收用例

- [x] 根目录 `AGENTS.md` 只保留全局协作规则，不再包含前端、后端、智能体详细实现要求。
- [x] 根目录 `AGENTS.md` 明确模块级 AGENTS 读取顺序。
- [x] 当前生效文档不再把 `apps/*` 作为主模块路径。
- [x] OpenSpec Module Spec 指向 `frontend/`、`backend/`、`agent/`。
- [x] 暂存范围不包含用户当前未提交的模块目录改动。

## 测试结果

```text
rg detailed implementation headings in AGENTS.md: no matches.
rg apps/* in README.md, AGENTS.md, docs/development, docs/architecture, openspec/modules: no matches.
Test-Path AGENTS.md and simplify-global-agents files: all True.
git diff --check: passed.
git status shows unrelated apps/* deletions and root frontend/backend/agent additions remain unstaged.
```

## 遗留问题

- 模块级 `frontend/AGENTS.md`、`backend/AGENTS.md`、`agent/AGENTS.md` 后续分别创建。
