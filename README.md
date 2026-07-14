# 桌面智算 (YSY Desktop)

面向本地深度学习实验和轻量大模型工作流的桌面应用。帮助用户在一台本机上完成 AI 项目管理、数据导入与检查、训练任务执行、推理服务创建、模型资产沉淀、运行环境管理和 AI 辅助诊断。

当前仓库处于 V1.0 原型到联调阶段：前端桌面壳、首页、设置页、AI 助手面板、AI 助手接口和设置页运行环境接口适配已落地，最新 PRD 稳定版本见 [docs/prd/V1.0 PRD.md](docs/prd/V1.0%20PRD.md)。

## 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 全局概览、快速入口、AI 助手居中对话框 |
| 项目 | `/projects` | 创建和管理 AI 项目，绑定数据、环境、代码目录 |
| 任务 | `/tasks` | 训练 / 部署任务的创建、执行、监控和日志查看 |
| 数据 | `/data` | 数据集导入、格式检查、质量分析和版本管理 |
| 模型 | `/models` | 模型资产导入、登记、检查、版本对比和推理部署 |
| 设置 | `/settings` | 运行环境管理（列表、系统环境创建、自定义环境创建、导入本地环境、删除）、AI 助手模型配置（模型列表、默认模型、连接测试）、用户偏好设置 |

**全局能力：**

- **左侧导航栏** — 模块切换，支持从统一顶部栏手动收起/展开
- **统一顶部栏** — 首页保留历史对话、新对话、打开位置和资源概览入口；项目、任务、数据、模型、设置页显示当前模块名和 AI 助手开关
- **三栏工作台布局** — 左侧导航、中部工作区、右侧上下文栏由 `AppShell` 统一管理
- **右侧上下文栏** — 首页为本机资源概览；项目、任务、数据、模型、设置页为 AI 助手面板，支持拖拽拉伸/缩窄
- **用户确认机制** — 所有会改变本机状态的动作必须经过用户确认

## 技术栈

### 前端 / 桌面端

| 技术 | 版本 | 用途 |
|------|------|------|
| [React](https://react.dev/) | ^19.0 | UI 渲染框架 |
| [TypeScript](https://www.typescriptlang.org/) | ^5.8 | 类型安全 |
| [Vite](https://vite.dev/) | ^7.0 | 开发服务器与构建工具 |
| [Electron](https://www.electronjs.org/) | ^33.0 | 桌面端容器（主进程、预加载、窗口管理） |
| [Lucide React](https://lucide.dev/) | ^0.468 | 图标库 |

### 后端 / AI 助手

| 技术 | 用途 |
|------|------|
| Python | 业务后端、任务执行器、数据/模型/环境检测 |
| AI Agent | 上下文组装、日志诊断、动作请求、受控工具编排 |

前端当前对接两个后端入口：AI 助手 / chat runtime 默认 `http://10.0.1.5:8765`，运行环境业务后端默认 `http://10.0.1.5:8000`。`VITE_API_BASE_URL` 可覆盖通用 API Base，`VITE_ENVIRONMENTS_API_BASE_URL` 可单独覆盖环境业务后端；开发环境中若浏览器直连失败，会回退到 Vite 同源代理。

## 项目结构

```text
ysy_desktop/
├── frontend/                  # React + Electron 桌面端
│   ├── src/
│   │   ├── app/               # App 入口、路由配置
│   │   ├── components/        # 通用组件（SidebarToggle、StatusBadge、EmptyState、ConfirmPlaceholder、
│   │   │                      #   Toolbar、PromptToolbar、PortalDropdown）
│   │   ├── features/          # 业务 Feature 目录（按领域划分子目录，当前为空壳待填充）
│   │   ├── hooks/             # 共享 Hooks（规划中）
│   │   ├── layouts/           # 布局组件（AppShell、Sidebar、WindowTitleBar、AssistantPanel 等）
│   │   ├── mocks/             # Mock 原型数据
│   │   ├── pages/             # 页面组件（Home、Projects、Tasks、Data、Models、Settings）
│   │   ├── services/          # API / IPC 服务层（环境、模型配置、聊天、会话等）
│   │   ├── stores/            # 全局状态 Store（规划中）
│   │   ├── styles/            # 全局样式与 CSS 设计 Token
│   │   └── types/             # TypeScript 领域类型定义
│   ├── electron/              # Electron 主进程与预加载脚本
│   │   ├── main/              # 主进程入口
│   │   └── preload/           # 预加载脚本
│   ├── docs/                  # 前端文档（Electron 启动说明等）
│   ├── scripts/               # 开发脚本
│   ├── index.html             # HTML 入口
│   ├── vite.config.ts         # Vite 配置
│   └── package.json           # 前端依赖与脚本
├── backend/                   # Python 后端、本地服务、任务执行器（规划中）
├── agent/                     # AI 助手、智能编排（规划中）
├── packages/shared/           # 前后端/智能体共用类型、枚举、工具方法（规划中）
├── configs/                   # 配置模板（日志、环境、Electron、后端）
├── scripts/                   # 启动、构建、测试、打包脚本
├── tests/                     # 集成测试、端到端测试、验收用例
├── docs/                      # PRD、开发规范、架构文档
│   ├── prd/                   # 产品需求文档
│   ├── planning/              # 开发规划
│   ├── architecture/          # 架构文档
│   ├── development/           # 开发规范（Git 工作流、OpenSpec、AI 编码规则）
│   └── process/               # 协作流程
└── openspec/                  # OpenSpec 规范与变更管理
    ├── config.yaml            # OpenSpec 配置
    ├── changes/               # 跨模块变更
    └── frontend/              # 前端 Spec、Module Spec、Changes
```

## 快速开始

### 环境要求

- **Node.js** >= 18（推荐 20+）
- **pnpm** >= 11

### 安装依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖（首次运行）
pnpm install
```

如果 Electron 下载缓慢或安装后缺少可执行文件，可使用镜像重新构建：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm rebuild electron
```

### 启动桌面端开发环境

```bash
cd frontend

# 启动 Vite 开发服务器并拉起 Electron 窗口
pnpm run electron:dev
```

该命令会启动 Vite `http://localhost:5174/`，等待服务可访问后打开 Electron。桌面壳在 Windows 使用页面内自定义标题栏和窗口控制，macOS 保留系统原生标题栏，初始最小窗口尺寸为 `1100x720`。

默认 AI 助手后端地址为 `http://10.0.1.5:8765`，默认环境业务后端地址为 `http://10.0.1.5:8000`。如需临时切换：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8765 pnpm run electron:dev
VITE_ENVIRONMENTS_API_BASE_URL=http://127.0.0.1:8000 pnpm run electron:dev
```

### 启动 Web 开发服务器

```bash
cd frontend

# 启动 Vite 开发服务器
pnpm run dev
```

开发服务器默认运行在 **http://localhost:5174/**，支持 HMR 热更新。

### 常用命令

```bash
# 类型检查
pnpm run typecheck

# 生产构建
pnpm run build

# 预览生产构建
pnpm run preview

# 构建后用 Electron 打开生产产物
pnpm run electron:preview
```

| 命令 | 说明 | 端口 |
|------|------|------|
| `pnpm run electron:dev` | 启动 Vite 并打开 Electron 桌面窗口 | 5174 |
| `pnpm run dev` | Vite 开发服务器 | 5174 |
| `pnpm run build` | TypeScript 编译 + Vite 打包 | - |
| `pnpm run electron:preview` | 构建后用 Electron 打开生产产物 | - |
| `pnpm run preview` | 预览生产构建 | 4174 |
| `pnpm run typecheck` | TypeScript 类型检查 | - |

## 文档入口

- [V1.0 PRD](docs/prd/V1.0%20PRD.md) — 产品需求文档
- [0-1 开发规划](docs/planning/development-plan.md) — 分阶段开发计划
- [仓库结构说明](docs/architecture/repository-structure.md) — 架构与目录说明
- [Vibe Coding 协作规范](docs/process/vibe-coding.md) — AI 辅助编码约定
- [OpenSpec 工作流](docs/development/openspec-workflow.md) — 需求变更规范
- [OpenSpec 目录入口](openspec/README.md) — OpenSpec 路径、阅读顺序和 Change 约定
- [Git 工作流](docs/development/git-workflow.md) — 分支与提交规范
- [AI 编码规则](docs/development/ai-coding-rules.md) — AI 编码约束
- [Code Review 清单](docs/development/pr-review-checklist.md) — PR 审查要点
- [前端 README](frontend/README.md) — 前端工程说明与启动方式
- [前端 AGENTS.md](frontend/AGENTS.md) — 前端 AI 编码规则
- [前端 OpenSpec](openspec/frontend/) — 前端 Global Spec、Module Spec、Changes
- [前端接口替换文档](frontend/docs/前端接口替换文档v2.md)
- [后端接口文档](frontend/docs/后端接口文档.md)
- [智能体接口文档](frontend/docs/智能体接口.md)
- [Electron 桌面端启动说明](frontend/docs/electron-setup.md)

## 服务器环境

- **服务器地址**: `10.0.1.5:32518`
- **禁止随意安装驱动**：不得在服务器上擅自安装或更新任何驱动，如需安装请先与团队确认。
- **禁止操作他人数据**：不得查看、修改、删除或移动服务器上其他用户/团队成员的数据、模型、配置和日志。

## 协作原则

1. 所有功能同时支持用户点击入口和 AI 助手入口。
2. 所有需求变更先写 OpenSpec，再开发，再验证。
3. 每次功能修改必须留下验收记录；是否提交 git 由当前协作指令决定。
4. 三人协作默认按前端、后端/本地执行、AI/产品编排拆分职责。
5. 高风险动作必须由后端受控执行并经过用户确认，AI 助手不得绕过后端直接执行本机操作。
