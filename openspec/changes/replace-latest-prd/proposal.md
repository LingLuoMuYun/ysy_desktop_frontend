# Proposal: replace-latest-prd

## 背景

用户确认 `D:/workspace/ysy_ui/V1.0 PRD.md` 才是当前最新 PRD，仓库中的 `V1.pdf` 和 `docs/prd/V1.md` 应删除，避免团队和 AI Coding 工具继续读取旧版本。

## 目标

- 将最新 PRD 放入 `docs/prd/V1.0 PRD.md`。
- 删除旧 `V1.pdf`。
- 删除旧 `docs/prd/V1.md`。
- 更新 README 和 AGENTS 的 PRD 入口。

## 非目标

- 不修改最新 PRD 正文内容。
- 不调整产品范围或技术方案。
- 不调整产品范围或技术方案。

## 影响范围

- 文档：README、AGENTS、PRD 稳定版本。
- OpenSpec：新增本次文档变更记录。
- 代码：无影响。

## 风险

- 若历史提交中曾提到 `V1.pdf` 或旧 `docs/prd/V1.md`，仅代表历史状态，不作为当前入口。
