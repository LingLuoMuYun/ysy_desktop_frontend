# Proposal: simplify-global-agents

## 背景

根目录 `AGENTS.md` 之前同时承担全局协作协议和前端、后端、AI 助手实现细则，内容过重。后续 `frontend/`、`backend/`、`agent/` 会分别维护模块级 `AGENTS.md`，因此根文件应只保留项目级规则。

## 目标

- 将根目录 `AGENTS.md` 精简为全局 AI 协作协议。
- 明确模块级 AGENTS 读取顺序。
- 将当前模块主路径统一为 `frontend/`、`backend/`、`agent/`。
- 更新当前生效文档和 Module Spec 中仍指向 `apps/*` 的路径。

## 非目标

- 不创建模块级 `frontend/AGENTS.md`、`backend/AGENTS.md`、`agent/AGENTS.md`。
- 不修改模块代码。
- 不处理用户当前未提交的模块目录改动。

## 影响范围

- 全局 AI 协作规则：`AGENTS.md`。
- 开发文档和架构文档：模块路径和职责描述。
- OpenSpec Module Spec：模块路径。
- OpenSpec Change：记录本次治理变更。

## 风险

- 模块级 AGENTS 尚未创建前，agent 需要回退到根 AGENTS、OpenSpec 和现有模块文档执行。
