# Proposal: codex-agents-guide

## 背景

项目计划全程使用 Codex 进行开发，需要一个根目录 Agent 工作协议，约束所有后续 Codex agent 的上下文读取、需求变更、代码实现、测试验证和 git 提交流程。

## 目标

- 新增根目录 `AGENTS.md`
- 明确 Codex agent 在本项目中的标准工作流
- 约束 spec、git、测试、前端、后端、AI 编排和安全边界
- 在 `README.md` 中加入 Agent 工作协议入口

## 非目标

- 不初始化具体前后端工程
- 不新增业务功能
- 不替代 `docs/process/vibe-coding.md`，只作为 Codex agent 的执行协议

## 用户入口

UI 入口：

- 无，本次为开发协作规范

AI 入口：

- Codex agent 在执行任何项目任务前读取 `AGENTS.md`

## 需求说明

### Requirement: Codex agent 工作协议

仓库必须提供一个根目录 Agent 指南，说明 Codex agent 如何参与本项目开发。

#### Scenario: 新 agent 接手任务

Given：

- 一个新的 Codex agent 开始处理项目任务

When：

- agent 读取根目录说明文件

Then：

- agent 能知道项目背景、核心文档、spec 流程、git 规范、测试要求和安全边界

## 影响范围

- 前端：无
- 后端：无
- AI 编排：新增 agent 工作协议
- 数据模型：无
- API：无
- 文档：新增 `AGENTS.md`，更新 `README.md`

## 风险

- 规范过细可能增加开发成本，后续可根据团队实践精简
