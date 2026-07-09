# OpenSpec

本目录是桌面智算的需求变更、模块边界和验收记录入口。OpenSpec 用来约束“要做什么、不能做什么、如何验收”，不是普通备忘录。

## 当前结构

```text
openspec/
  config.yaml                         # OpenSpec 生成与书写规则
  README.md                           # 本文件，说明目录入口和协作口径
  frontend/
    global/global.spec.md             # 前端工作流使用的系统级边界
    modules/frontend.spec.md          # 前端 / Electron 模块约束
    modules/backend.spec.md           # 后端契约边界
    modules/agent.spec.md             # AI 助手与智能编排边界
    changes/                          # 前端需求变更目录
  changes/
    improve-desktop-responsive-layout/ # 跨模块或当前活跃变更
  specs/                              # OpenSpec 工具预留目录
```

## 阅读顺序

1. `openspec/frontend/global/global.spec.md`
2. 与任务相关的 `openspec/frontend/modules/*.spec.md`
3. 当前需求对应的 `openspec/frontend/changes/<change-id>/` 或 `openspec/changes/<change-id>/`
4. `proposal.md`、`design.md`、`tasks.md`、`verification.md`
5. 相关代码、接口文档和验收记录

如果路径不存在，记录“未找到/待确认”，不要临时创建平行规范目录。

## Change 目录约定

每个需求一个独立 Change：

```text
openspec/frontend/changes/<change-id>/
  proposal.md
  design.md        # 涉及架构、API、数据模型、状态机或复杂交互时需要
  tasks.md
  acceptance.md    # 可选，记录验收场景和结果
```

跨前端边界或已有顶层变更可放在：

```text
openspec/changes/<change-id>/
```

不要用个人名、分支名或“大杂烩”目录替代需求目录。

## 更新规则

- 需求变更先写 OpenSpec，再实现，再验证。
- 修改一级模块、核心实体、状态机、高风险动作边界时，必须同步评估 Global / Module Spec。
- 完成实现后更新 `tasks.md` 和验收记录；只改代码不更新任务状态视为未收口。
- 不再使用 `docs/specs/`；不要重新创建平行 specs 体系。

