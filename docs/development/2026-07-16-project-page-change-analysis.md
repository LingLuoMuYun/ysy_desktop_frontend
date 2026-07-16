# 2026-07-16 项目页变更分析总结

## 范围

本总结覆盖当前工作区中与前端项目页、项目详情弹窗、顶部刷新按钮、项目 API 适配和 OpenSpec 验收记录相关的所有未提交变更。

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

- 当前分支存在多处前置未提交改动，项目页相关提交需要整体提交，不能只拆项目详情弹窗，否则可能缺少 `frontend/src/features/projects/` 依赖。
- `http://10.0.221.143:8000` 是否为团队确认的项目业务后端默认地址，待确认。
- 项目详情中的操作记录、任务记录、模型资产是否下一步立即接入真实接口，待确认。
- “创建部署任务 / 创建训练任务”入口当前仅占位，后续需确认打开任务创建表单还是跳转任务模块。
- 顶部刷新按钮当前只提供前端动画反馈，实际刷新行为仍依赖外部传入的 `onRefreshPage()`。

## 建议下一步

1. 用 Vite / Electron 打开项目页，按 1280px、1120px、760px 以下窗口宽度做截图验收。
2. 连接后端验证 `GET /api/projects`、`GET /api/projects/{projectId}`、`POST /api/projects`、`DELETE /api/projects/{projectId}`。
3. 为项目详情继续接入 `GET /api/tasks?projectId=...`、`GET /api/models?projectId=...` 和操作记录接口。
4. 明确创建训练任务 / 创建部署任务的入口规则和路由参数。
