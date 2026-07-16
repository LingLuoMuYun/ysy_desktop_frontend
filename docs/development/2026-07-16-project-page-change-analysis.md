# 2026-07-16 项目页变更分析总结

## 范围

本总结覆盖当前分支中与前端项目页、项目详情弹窗、顶部刷新按钮、项目 API 适配和 OpenSpec 验收记录相关的变更。

涉及模块：

- `frontend/src/pages/ProjectsPage.tsx`
- `frontend/src/pages/ProjectsPage.css`
- `frontend/src/features/projects/`
- `frontend/src/services/projectsApi.ts`
- `frontend/src/types/domain.ts`
- `frontend/src/layouts/WindowTitleBar.tsx`
- `frontend/src/styles/globals.css`
- `frontend/vite.config.ts`
- `openspec/frontend/changes/optimize-project-page-reference/`
- `openspec/frontend/changes/add-project-detail-dialog/`

## 项目逻辑梳理

### 1. 项目在产品中的位置

项目是桌面智算的长期实验容器，保存项目名称、类型、描述、工作空间、默认运行环境和长期资源关系。项目不直接保存训练脚本、启动命令、工作目录或输出目录；这些执行字段属于任务模块。

当前项目页承担三类职责：

- 管理项目记录：列表、筛选、搜索、分页、创建、删除。
- 进入项目上下文：点击项目后查看项目概览、任务记录、模型资产和操作记录。
- 承接任务入口：从项目上下文创建训练任务或部署任务，但本次只保留入口占位。

### 2. 当前项目页前端调用链

```text
ProjectsPage
  -> useProjectList
      -> projectsApi.list
      -> projectsApi.specs
  -> ProjectCreateDialog
      -> projectsApi.validateWorkspace
      -> projectsApi.create
  -> ProjectDeleteDialog
      -> projectsApi.delete
  -> ProjectDetailDialog
      -> projectsApi.detail
```

页面职责边界：

- `ProjectsPage.tsx`：负责页面装配、Toast、弹窗打开/关闭和 API 结果桥接。
- `useProjectList.ts`：负责筛选、搜索、分页、URL 同步和列表请求。
- `projectsApi.ts`：负责请求后端、统一错误映射和后端 DTO 到前端领域类型的转换。
- `ProjectCreateDialog.tsx`：负责表单填写、路径校验、创建前确认和提交。
- `ProjectDeleteDialog.tsx`：负责高风险删除确认，不删除本地文件。
- `ProjectDetailDialog.tsx`：负责项目详情展示和 Tab 切换。

### 3. 项目列表逻辑

项目列表状态由 `useProjectList` 托管：

- 初始状态从 `window.location.search` 读取。
- `keyword`、`type`、`status`、`page` 写回 URL，便于刷新后恢复。
- 筛选条件变化时重置到第 1 页。
- 请求失败时在列表区域展示错误状态和重试入口。

列表展示字段：

- 项目名称、状态、描述、路径。
- 训练任务数、部署任务数、数据集数量、模型数量。
- 更新时间。

当前分页：

- 每页 5 条项目。
- 页码和总数来自后端分页响应。

### 4. 项目创建逻辑

创建项目是中风险操作，流程分两步：

1. 用户填写项目名称、项目类型、项目保存位置、默认运行环境和描述。
2. 前端调用路径校验接口，校验通过后展示确认摘要，确认后提交 `confirmed=true`。

边界：

- 不提交训练脚本入口。
- 不提交启动命令。
- 不提交依赖文件。
- 不提交初始数据集绑定。

原因：

- 项目保存长期上下文。
- 训练入口、命令、输出路径等属于任务执行快照，应在训练任务或部署任务中配置。

### 5. 项目删除逻辑

删除项目是高风险操作，当前前端只提交删除项目登记：

```json
{
  "confirmed": true,
  "deleteLocalFiles": false
}
```

边界：

- 不删除本机文件。
- 不删除数据集、模型权重或训练产物。
- 是否可恢复取决于后端数据恢复能力。

### 6. 项目详情逻辑

项目详情弹窗当前以 `GET /api/projects/{projectId}` 获取基础信息，列表项作为 fallback。弹窗展示：

- 项目概览：基础项目字段。
- 操作记录：当前为空态。
- 任务记录：当前为空态。
- 模型资产：当前为空态。

后续数据来源建议：

| 区域 | 推荐接口 |
|------|----------|
| 项目概览 | `GET /api/projects/{projectId}` |
| 操作记录 | `GET /api/activity/recent?projectId={projectId}` 或后续项目操作记录接口 |
| 任务记录 | `GET /api/tasks?projectId={projectId}` |
| 模型资产 | `GET /api/models?projectId={projectId}` |

弹窗底部的创建训练任务和创建部署任务当前不触发真实动作。后续应确认是打开任务创建弹窗、跳转任务模块，还是在项目页内继续完成任务创建流程。

### 7. 状态与风险边界

当前项目页遵守以下边界：

- 查看详情属于低风险，只读展示，不需要确认。
- 创建项目属于中风险，提交前展示确认摘要。
- 删除项目属于高风险，必须确认，且当前不删除本地文件。
- 创建训练任务 / 部署任务入口只占位，不启动本机进程。
- AI 助手不得绕过页面入口或后端受控接口直接执行项目相关高风险动作。

## 变更概览

### 1. 项目页结构拆分

`ProjectsPage.tsx` 从大组件拆为页面装配层，项目创建、删除、详情和列表状态逻辑下沉到 `frontend/src/features/projects/`。

当前拆分结果：

- `useProjectList.ts`：负责项目列表加载、筛选、分页和 URL 状态同步。
- `ProjectCreateDialog.tsx`：负责创建项目两步流程，包含路径校验和确认提交。
- `ProjectDeleteDialog.tsx`：负责删除项目高风险确认。
- `ProjectDetailDialog.tsx`：负责项目详情弹窗。
- `projectFormHelpers.tsx`：复用项目表单字段、确认信息行和状态占位。

收益：

- 页面组件只负责组合和桥接 API / Toast / Dialog 状态。
- 创建、删除、详情弹窗可以独立维护。
- 后续接入项目详情内的任务记录、模型资产和操作记录时，改动边界更清晰。

### 2. 项目列表布局修复

修复了项目列表在单卡片或少量卡片时高度无法填满页面剩余空间的问题。

关键处理：

- 将页面级选择器从 `.project-page` 改为 `.workbench-page.project-page`，提高特异度，避免被全局 `.workbench-page` 的 Grid 布局覆盖。
- 将项目页改为纵向 Flex 布局。
- `.project-list-shell` 和 `.project-grid` 使用 `flex: 1`、`min-height: 0` 和顶部对齐。
- 移除会导致列表壳体按内容高度收缩的额外上边距与边框干扰。

结果：

- 项目列表壳体从搜索栏下方延展到页面底部。
- 单项目卡片不再贴近分页栏底部。
- 卡片从滚动区域顶部顺序排列。

### 3. 项目详情弹窗

新增项目详情弹窗交互。

交互入口：

- 点击项目名称。
- 点击项目卡片空白区域。

弹窗内容：

- 头部：项目图标、项目名称、状态标签。
- Tab：项目概览、操作记录、任务记录、模型资产。
- 项目概览：项目名称、项目类型、项目状态、项目保存位置、默认运行环境、更新时间。
- 底部：创建部署任务、创建训练任务入口占位。

自适应优化：

- 弹窗最大宽度收敛为 680px。
- 使用 `max-height` 随视口收缩，避免固定大高度。
- 标题、字段、Tab 和按钮字号下调。
- 小宽度下标题可换行，Tab 可横向滚动，底部按钮可换行。

当前未接入：

- 操作记录列表。
- 任务记录列表。
- 模型资产列表。
- 底部创建任务入口真实跳转或表单打开。

### 4. 项目 API 与类型适配

项目接口层调整：

- 项目后端默认地址更新为 `http://10.0.221.143:8000`。
- Vite 代理补充 `/api/projects` 到业务后端。
- `ProjectSummary.datasetCount` 从字符串改为数字。
- Mock 项目数据同步改为数字类型。

收益：

- 类型更贴近后端接口契约。
- 列表中数据集数量和后续统计计算更容易复用。
- 本地开发时项目接口可通过 Vite proxy 转发到业务后端。

### 5. 顶部刷新按钮反馈

`WindowTitleBar` 的刷新按钮增加短时旋转反馈。

实现方式：

- 增加 `isRefreshing` 状态。
- 点击后触发 `onRefreshPage()`。
- 按钮禁用 600ms，避免连续点击。
- `globals.css` 增加 `icon-spin` 动画。

收益：

- 用户点击刷新后有可见反馈。
- 降低短时间重复点击概率。

### 6. OpenSpec 与记录

已更新或新增：

- `openspec/frontend/changes/optimize-project-page-reference/`
  - 补充项目列表高度、顶部对齐、Flex 布局相关任务和验收记录。
- `openspec/frontend/changes/add-project-detail-dialog/`
  - 新增项目详情弹窗需求说明、任务清单和验收记录。

另有前端工作记录：

- `frontend/项目列表页高度问题修复记录.md`

## 验证情况

已验证：

- `pnpm run typecheck` 通过。
- `git diff --check` 通过，仅存在 Git 提示的 LF/CRLF 换行转换。

未验证：

- 未启动 Vite / Electron 做截图验收。
- 未连接真实后端逐接口验证项目创建、删除、详情加载。
- 未验证不同窗口尺寸下的实际视觉截图。

## 风险与待确认

- `http://10.0.221.143:8000` 是否为团队确认的项目业务后端默认地址，待确认。
- 项目详情中的操作记录、任务记录、模型资产是否下一步立即接入真实接口，待确认。
- “创建部署任务 / 创建训练任务”入口当前仅占位，后续需确认打开任务创建表单还是跳转任务模块。
- 顶部刷新按钮当前只提供前端动画反馈，实际刷新行为仍依赖外部传入的 `onRefreshPage()`。

## 建议下一步

1. 用 Vite / Electron 打开项目页，按 1280px、1120px、760px 以下窗口宽度做截图验收。
2. 连接后端验证 `GET /api/projects`、`GET /api/projects/{projectId}`、`POST /api/projects`、`DELETE /api/projects/{projectId}`。
3. 为项目详情继续接入 `GET /api/tasks?projectId=...`、`GET /api/models?projectId=...` 和操作记录接口。
4. 明确创建训练任务 / 创建部署任务的入口规则和路由参数。
