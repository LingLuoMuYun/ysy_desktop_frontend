# Design: frontend-page-framework

## 原型依据

原型地址：`http://10.0.89.199:5173`

已观察到的结构：

- 桌面背景上承载一个窗口式应用容器。
- 左侧为窄导航栏，包含品牌入口和六个一级模块：首页、项目、任务、数据、模型、设置。
- 顶部为统一工具栏，首页包含历史对话、新对话、打开位置和资源概览入口；其他模块包含当前模块名和 AI 助手开关。
- 首页历史对话入口打开后，在左侧导航与主工作区之间显示历史栏；历史栏展示已产生消息的对话，支持选择恢复。
- 首页主区域以居中 AI 输入框为核心，包含权限/模式选择、模型选择、项目关联、发送入口、建议问题和可切换资源概览。
- 项目、任务、数据、模型、设置页面使用高密度列表/卡片工作台布局，页面一级模块名显示在统一顶部栏中，内容区保留筛选、主操作按钮、状态标签和行级操作。
- AppShell 统一承载右侧上下文栏：首页显示本机资源概览，其他业务页面显示 AI 助手面板，用于后续接收当前页面和对象上下文。

## 信息架构

```text
AppShell
  DesktopFrame
    WindowTitleBar
    SidebarNavigation
    HomeConversationHistory
    MainWorkspace
      HomePage
      ProjectsPage
      TasksPage
      DataPage
      ModelsPage
      SettingsPage
    RightContextPanel
      Home: LocalResourcePopover
      Other modules: AssistantPanel
```

## 前端目录建议

```text
frontend/
  src/
    app/
      App.tsx
      router.tsx
    layouts/
      AppShell.tsx
      Sidebar.tsx
    WindowTitleBar.tsx
    AssistantPanel.tsx
    LocalResourcePopover.tsx
    pages/
      HomePage.tsx
      ProjectsPage.tsx
      TasksPage.tsx
      DataPage.tsx
      ModelsPage.tsx
      SettingsPage.tsx
    components/
      SidebarToggle.tsx
      StatusBadge.tsx
      Toolbar.tsx
      EmptyState.tsx
      ConfirmPlaceholder.tsx
    features/
      home/
      projects/
      tasks/
      datasets/
      models/
      settings/
    styles/
      globals.css
      tokens.css
    types/
      domain.ts
    mocks/
      prototypeData.ts
  electron/
    main/
    preload/
  tests/
```

## 路由

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 中心 AI 输入入口和资源概览 |
| 项目 | `/projects` | 项目列表、筛选、创建入口 |
| 任务 | `/tasks` | 训练任务 / 部署任务切换、任务列表 |
| 数据 | `/data` | 数据集列表、导入入口、检查入口 |
| 模型 | `/models` | 模型资产列表、导入入口、创建部署任务入口 |
| 设置 | `/settings` | 环境、AI 助手、个人信息分区 |

## 视觉结构

- 以浅色工作台为主，保持原型的白色窗口、浅灰背景、蓝色高亮和低饱和状态色。
- 导航使用固定窄栏，选中态需要清晰但不夸张。
- 工作台页面避免营销式 hero，优先信息密度、扫描效率和稳定布局。
- 项目、任务、数据、模型、设置页的一级模块标题只在统一顶部栏展示，页面内容区不得重复展示相同标题。
- 卡片和列表项保持紧凑，圆角不超过 8px，除非原型已有明确更大容器。
- 文本必须在桌面常见宽度下不溢出、不遮挡操作按钮。
- 按钮、筛选器、状态标签和图标尺寸保持一致，避免切换页面时布局跳动。

## 页面框架要求

### 首页

- 中心标题为“今天想让这台机器帮你做什么？”或后续原型确认文案。
- 提供多行输入框、添加入口、辅助模式选择、模型选择、项目关联和发送按钮。
- 顶部栏“对话历史”切换左侧历史栏；历史栏位于主菜单栏右侧、首页对话框左侧，不能覆盖主工作区。
- 顶部栏“新对话”创建空白当前会话；空白会话不展示在历史列表，首次发送消息后进入历史并置顶。
- 提供建议问题气泡和换一批入口。
- 顶部栏提供资源概览入口；打开后右侧上下文栏展示 CPU、GPU、内存、磁盘、网络和最近操作的结构占位。

### 项目

- 提供创建项目入口。
- 提供项目类型、状态等筛选。
- 项目卡片展示名称、状态、描述、路径、训练任务数、部署任务数、数据集数量和更新时间。
- 行级操作包含复制、删除、创建推理任务、创建训练任务等占位。

### 任务

- 提供训练任务 / 部署任务分段切换。
- 提供创建训练任务入口和筛选。
- 任务项展示名称、状态、进度、项目、数据集/模型、运行环境、时间和行级操作。
- 启动、终止、删除等高风险入口必须使用禁用或确认占位。

### 数据

- 提供导入数据集入口。
- 展示数据集名称、状态、路径、格式、样本数、关联项目、更新时间。
- 提供绑定/换绑、删除、AI 检查等占位操作。

### 模型

- 提供导入模型入口。
- 展示模型名称、状态、路径、类型、来源、关联项目、更新时间。
- 提供绑定/换绑、创建部署任务、删除、AI 检查等占位操作。

### 设置

- 提供环境、AI 助手、个人信息分区。
- 默认展示环境列表，包含环境名称、状态、用途、Python、框架、CUDA、更新时间。
- 检测环境、创建环境、删除、设为默认等入口必须保留确认占位。
- API Key 展示必须脱敏，不能出现真实密钥。

## 数据与状态

- 本阶段使用前端 mock 数据，不持久化业务状态。
- 首页对话历史在页面框架阶段使用前端内存态，后续可由 `GET /api/sessions` 和 `GET /api/sessions/{session_key}` 替换数据来源。
- Mock 数据必须使用非敏感路径和示例名称。
- 页面需预留 loading、empty、error 和 disabled 状态组件。
- AI 助手只展示静态对话入口和上下文占位，不发送真实请求。

## 验证策略

- 静态检查：TypeScript、lint 或项目已有等价检查。
- 构建检查：前端构建或 Vite 编译通过。
- 浏览器验证：启动页面后检查六个路由、导航选中态、主要区域布局、文本溢出和原型一致性。
- 视觉验证：至少覆盖桌面视口，必要时补充窄宽度窗口检查。
