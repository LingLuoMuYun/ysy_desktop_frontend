# Proposal: remove-legacy-docs-specs

## 背景

仓库已按 OpenSpec 体系完全重建，`docs/specs/` 与根目录 `openspec/` 并存会造成团队和 AI Coding 工具误读。

## 目标

- 删除历史 `docs/specs/` 目录。
- 更新当前文档中所有指向 `docs/specs/` 的入口。
- 明确新需求统一进入 `openspec/changes/`。

## 非目标

- 不删除 `openspec/`。
- 不调整产品需求或运行时代码。
- 不处理用户当前未提交的目录重建改动。

## 影响范围

- 文档：README、AGENTS、开发规范、vibe coding 规范。
- OpenSpec：新增本次变更记录。

## 风险

- 历史 spec 记录被删除后，旧提交的上下文只能通过 Git 历史查看。
