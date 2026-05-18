# Proposal: bootstrap-docs

## 背景

项目当前只有原始 `V1.pdf`，尚未形成可迭代的 Markdown PRD、0-1 开发规划、AI 辅助开发规范和三人协作流程。为了后续从 0-1 开发时能稳定使用 vibe coding，需要先建立文档和变更记录基础。

## 目标

- 将 V1 PRD 整理为 Markdown 文档
- 建立 0-1 开发规划
- 建立 vibe coding 协作规范
- 建立类 OpenSpec 的需求变更目录和模板
- 初始化 git 仓库并提交第一版文档

## 非目标

- 不初始化具体前端或后端工程
- 不决定最终桌面壳和技术栈
- 不实现业务功能

## 用户入口

UI 入口：

- 暂无，本次只建立项目文档体系

AI 入口：

- 后续开发中，AI 按 `docs/process/vibe-coding.md` 和 `docs/specs/README.md` 协助生成 spec、代码、测试和验收记录

## 需求说明

### Requirement: 文档化 V1 PRD

系统必须保留原始 `V1.pdf`，并提供可编辑、可迭代的 Markdown PRD。

#### Scenario: 团队查看 V1 需求

Given：

- 团队成员进入仓库

When：

- 打开 `README.md`

Then：

- 可以通过文档入口找到 `docs/prd/V1.md`

### Requirement: 规范化功能变更流程

系统必须提供需求变更模板，约束每次功能修改先写 spec，再开发、验证和提交。

#### Scenario: 新增功能

Given：

- 团队准备开发一个新功能

When：

- 创建 `docs/specs/changes/<change-id>/`

Then：

- 可以按模板补齐 proposal、tasks、design 和 acceptance

## 影响范围

- 前端：无
- 后端：无
- AI 编排：新增协作规范
- 数据模型：无
- API：无
- 文档：新增 `README.md` 和 `docs/`

## 风险

- PRD 来自 PDF 文本提取，后续需要结合原型图继续校对
- 技术栈建议仍是规划性质，工程初始化前需要团队确认
