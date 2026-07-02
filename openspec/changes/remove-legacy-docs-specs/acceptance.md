# Acceptance: remove-legacy-docs-specs

## 验收环境

- 日期：2026-07-01
- 分支：main
- 操作系统：Windows

## 验收用例

- [x] `docs/specs/` 不存在。
- [x] 当前文档不再把 `docs/specs/` 作为需求入口。
- [x] README 指向 OpenSpec 工作流。
- [x] AGENTS 指向 `openspec/changes/`。
- [x] 不提交用户当前未提交的目录重建改动。

## 测试结果

```text
Test-Path docs/specs: False.
rg docs/specs references: only deletion/no-longer-retained notes remain.
git diff --check: passed.
Staging scope excludes existing module directory additions/deletions unrelated to this change.
```

## 遗留问题

- 当前工作区存在用户未提交的目录重建改动，本变更不处理这些文件。
