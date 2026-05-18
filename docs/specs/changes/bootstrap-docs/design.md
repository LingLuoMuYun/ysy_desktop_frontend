# Design: bootstrap-docs

## 总体设计

本次只建立文档体系，不引入前后端工程代码。文档分为四层：

- `docs/prd/`：产品需求
- `docs/planning/`：开发规划
- `docs/process/`：协作和工程流程
- `docs/specs/`：需求变更记录和模板

## 取舍

- 保留 `V1.pdf` 作为原始来源，避免转换过程丢失上下文。
- Markdown 版 PRD 使用结构化表达，方便后续 diff、review 和迭代。
- 变更规范只提供轻量模板，避免 0-1 阶段流程过重。

## 后续扩展

工程初始化后，可以继续补充：

- API 契约目录
- 数据模型文档
- 架构决策记录
- CI 检查规则
- PR 模板
