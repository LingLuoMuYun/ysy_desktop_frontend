# Tasks: improve-settings-page

## 已完成任务

- [x] 确认前端 OpenSpec Change 位于 `openspec/frontend/changes/improve-settings-page/`。
- [x] 阅读前端 Global Spec、Frontend Module Spec、PRD 和现有 SettingsPage 代码。
- [x] 修正 QLoRA 环境 status/tone：从 `"需修复"` / `"warning"` 改为 `"可用"` / `"success"`。
- [x] 新增 `EnvironmentCheckItem` 类型（label / passed / detail）。
- [x] 新增 `RuntimeEnvironmentDetail` 类型（extends RuntimeEnvironmentSummary，含 lastCheckTime / lastCheckResult / checkItems / suggestion）。
- [x] 新增 `AssistantModelDetail` 类型（extends AssistantModelSummary，含 apiBaseUrl / modelId / apiKey / apiKeyConfigured / connectionStatus / maxOutputLength / temperature / timeout / retryCount）。
- [x] 新增 6 个环境的 `runtimeEnvironmentDetails` mock 数据（含检测项和使用建议）。
- [x] 新增 5 个模型的 `assistantModelDetails` mock 数据（含链接信息和生成参数）。
- [x] SettingsPage 新增 `selectedEnvironmentId` / `selectedModelId` 状态管理。
- [x] `isViewingDetail` 判断逻辑：任一 Tab 有选中项即隐藏 topbar。
- [x] 详情页状态通过 `settings-page--detail` CSS class 切换 grid 布局（隐藏 topbar 行）。
- [x] `EnvironmentSettings` 接收 `selectedEnvironmentId` / `onSelectEnvironment` / `onBack` props。
- [x] 实现 `EnvironmentDetail` 组件：头部（返回按钮 + 图标 + 标题 + 状态 + 操作按钮）、基础信息网格、检测结果列表（逐项通过/未通过图标 + 详情）、使用建议。
- [x] `AssistantModelSettings` 接收 `selectedModelId` / `onSelectModel` / `onBack` props。
- [x] 实现 `ModelDetail` 组件：头部（返回按钮 + 模型图标 + 标题 + 厂商标签 + 状态 + 默认标签 + 操作按钮）、链接信息卡片（API Base URL / 模型标识 / API Key / 连接状态）、生成参数卡片（上下文长度 / 最大输出 / Temperature / 超时 / 重试 / 默认模型）。
- [x] 环境和模型列表页添加搜索输入框，支持按名称/用途或厂商实时过滤。（后续已移除）
- [x] 搜索无结果时展示空态（"未找到匹配的环境/模型" + "尝试其他关键词"）。（后续已移除）
- [x] 顶部栏操作按钮移至右侧：`settings-topbar` 使用 `justify-content: space-between`，新增 `settings-topbar__right` 容器。
- [x] 移除"检测全部环境 / 检测全部模型"按钮，顶部栏右侧仅保留"创建环境 / 添加模型"。
- [x] 移除环境和 AI 助手列表搜索栏及关联过滤逻辑、空态展示。
- [x] 环境详情页"检测环境"和"删除"按钮样式优化：primary 蓝色填充 + danger 红色描边。
- [x] 模型详情页"编辑""删除""连接测试"按钮同样使用 settings-action-button 系列样式。
- [x] 新增 `.env-detail-page` 详情页整体布局 CSS。
- [x] 新增 `.env-detail__header` / `__header-left` / `__back-btn` / `__titles` / `__badges` / `__purpose-tag` / `__header-actions` 头部样式。
- [x] 新增 `.env-detail__body` / `__section` / `__info-grid` / `__info-item` / `__info-label` / `__info-value` 主体内容样式。
- [x] 新增 `.env-detail__info-card`：白底圆角边框信息卡片。
- [x] 新增 `.env-detail__info-value--mono`：等宽字体（SF Mono / Cascadia Code）。
- [x] 新增 `.env-detail__api-key`：浅灰背景 + 圆角脱敏 API Key 展示。
- [x] 新增 `.env-detail__status-dot`：绿/黄/红/灰圆点连接状态指示器。
- [x] 新增 `.env-detail__bool-pill` 和 `--true` 变体：绿色/灰色布尔值 Pill 标签。
- [x] 新增 `.env-detail__model-icon` 和 `--blue` / `--warm` / `--dark` 变体：模型头部图标渐变色。
- [x] 新增 `.env-detail__check-list` / `__check-item` / `__check-icon` / `__check-label` / `__check-status` / `__check-detail` 检测结果列表样式。
- [x] 新增 `.env-detail__suggestion` 使用建议区块样式。
- [x] 新增 `.settings-empty` 搜索空态样式。
- [x] 新增 `.settings-action-button--danger` 红色危险按钮样式。
- [x] 环境卡片悬浮交互：hover 时显示蓝色高亮边框 + 浅蓝背景 + 阴影，右侧浮现"检测环境"和"删除"按钮（stopPropagation 阻止冒泡）。
- [x] TypeScript 类型检查通过 (`pnpm run typecheck`)。
- [x] Vite 构建通过 (`pnpm run build`)。

## 待后续 Change 处理

以下内容为后续架构重构 Change 的范围，不在本次变更中：

- [ ] SettingsPage 拆分为 Feature 组件（EnvironmentSettings / AssistantModelSettings / ProfileSettings）
- [ ] 抽取共享组件（SearchInput / FormField / PathField）
- [ ] CSS 硬编码颜色值替换为设计 Token（`--blue` / `--text` / `--surface-muted` 等）
- [ ] 高风险操作接入 ConfirmPlaceholder 组件
- [ ] ProfileSettings 表单 isDirty / isSaving / saveError 状态
- [ ] API Key 真实脱敏逻辑（当前为 mock 展示）
