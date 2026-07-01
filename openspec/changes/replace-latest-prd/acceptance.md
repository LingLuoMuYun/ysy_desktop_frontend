# Acceptance: replace-latest-prd

## 验收环境

- 日期：2026-07-01
- 分支：main
- 操作系统：Windows

## 验收用例

- [x] `docs/prd/V1.0 PRD.md` 存在。
- [x] 根目录 `V1.pdf` 已删除。
- [x] `docs/prd/V1.md` 已删除。
- [x] README 指向最新 PRD。
- [x] AGENTS 必读文档指向最新 PRD。
- [x] 工作区没有误提交无关文件。

## 测试结果

```text
Test-Path docs/prd/V1.0 PRD.md: True.
Test-Path V1.pdf: False.
Test-Path docs/prd/V1.md: False.
git diff --check: passed.
Current-entry scan: old PRD paths only appear in this change record as deletion notes.
```

## 遗留问题

- 当前 PRD 入口以 `docs/prd/V1.0 PRD.md` 为准。
