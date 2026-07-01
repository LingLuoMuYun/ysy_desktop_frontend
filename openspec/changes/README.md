# OpenSpec Changes

本目录存放按需求划分的 OpenSpec Change。每个需求一个独立目录，不按个人、分支或代码模块合并成“大 spec”。

推荐结构：

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  tasks.md
  specs/
    <module-or-capability>/spec.md
```

最小要求：

- `proposal.md`：背景、目标、非目标、影响模块、用户流程、风险和验收标准。
- `tasks.md`：可执行任务清单和完成状态。
- `design.md`：涉及架构、API、数据模型、状态机、AI 工具或复杂流程时必须提供。
- `specs/`：需要按 OpenSpec delta 形式描述模块能力变化时使用。

命名建议：

```text
project-create
dataset-import-check
training-task-start
model-service-launch
agent-failure-diagnosis
```

规则：

- 分支可以按人或模块划分，但 Change 必须按需求划分。
- 不允许用个人 Change 替代正式需求 Change。
- 不允许一个 Change 同时承载多个无关需求。
- PR 必须链接对应 Change。
- 需求完成后必须更新任务状态和验收结果。
