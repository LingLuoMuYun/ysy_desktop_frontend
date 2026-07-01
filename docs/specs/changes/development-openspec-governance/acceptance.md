# Acceptance: development-openspec-governance

## 验收环境

- 日期：2026-07-01
- 分支：feature/zw-production-bootstrap
- commit：本次文档变更提交号见最终回复
- 操作系统：Windows

## 验收用例

- [x] 目标文档文件均已创建。
- [x] `AGENTS.md` 已更新为 OpenSpec + Git + AI Coding 行为规则。
- [x] 文档中明确 main、dev、feature 分支分别存放什么。
- [x] 文档中明确代码按模块组织、Spec Change 按需求组织。
- [x] 文档中明确开发人员与项目负责人 / 架构负责人的职责边界。
- [x] 文档中包含 PR 检查清单。
- [x] 文档中包含 Spec Alignment Review 制度。
- [x] 文档中包含 Mermaid 流程图。

## 测试结果

```text
Test-Path docs/development/*.md and openspec target files: all True.
Placeholder scan: no unfinished validation or submission markers remain; only intentional change-id examples are present.
Desktop shell wording scan: confirms Electron/Tauri difference is documented as a separate-change requirement.
```

## 遗留问题

- 外部请求文本提到 Electron，当前仓库存在 Tauri 配置；规范已要求切换桌面壳必须单独 OpenSpec Change。
