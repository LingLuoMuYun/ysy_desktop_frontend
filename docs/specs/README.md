# 需求变更规范

本目录借鉴 OpenSpec 的思想：先描述需求变化，再开发实现。目标是让 0-1 开发中的需求、代码、测试和 git 记录能互相追踪。

## 目录结构

```text
docs/specs/
  README.md
  templates/
    proposal.md
    tasks.md
    design.md
    acceptance.md
  changes/
    <change-id>/
      proposal.md
      tasks.md
      design.md
      acceptance.md
```

## change-id 命名

使用短横线命名，表达业务意图。

示例：

```text
project-create
project-import
env-detect
training-yolo
model-service-start
assistant-task-panel
```

## 什么时候需要写 spec

必须写 spec：

- 新功能
- 用户流程变化
- API 变更
- 数据模型变更
- AI 工具能力变更
- 权限、文件、环境、训练任务相关变更

可以不写 spec：

- 纯拼写修正
- 注释修正
- 不改变行为的小范围样式修正

## Spec 内容要求

每个 spec 至少回答：

- 用户要解决什么问题
- UI 入口是什么
- AI 入口是什么
- 涉及哪些页面、API、数据模型和任务
- 成功和失败状态如何表现
- 验收标准是什么
- 不做什么

## 完成定义

一个需求完成必须满足：

- `proposal.md` 说明清楚范围
- `tasks.md` 全部完成
- 代码已实现
- 测试或人工验收已记录
- 文档已更新
- git commit 已提交
