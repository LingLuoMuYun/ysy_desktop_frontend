# frontend

React + Electron 桌面端代码目录。

## 职责

- Electron 主进程、预加载脚本和窗口生命周期。
- React 渲染进程页面、状态管理和组件。
- 调用后端受控 API，不直接执行本机高风险动作。
- 承载首页、项目、任务、数据、模型、设置和 AI 助手界面。

默认 AI 助手 / chat runtime 地址为 `http://10.0.1.5:8765`，默认运行环境业务后端地址为 `http://10.0.1.5:8000`。服务层位于 `src/services/`，当前已接入运行环境列表、创建、导入、删除，AI 助手模型配置、运行时模型切换、聊天流和会话接口。

## 快速开始

```bash
pnpm install               # 安装依赖
pnpm run electron:dev      # 启动 Vite + Electron 桌面窗口
pnpm run dev               # 仅启动 Vite 开发服务器（浏览器访问）
pnpm run build             # 生产构建
pnpm run typecheck         # TypeScript 类型检查
```

临时切换后端：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8765 pnpm run electron:dev
VITE_ENVIRONMENTS_API_BASE_URL=http://127.0.0.1:8000 pnpm run electron:dev
```

| 命令 | 说明 | 端口 |
|------|------|------|
| `pnpm run electron:dev` | 启动 Vite + Electron 桌面窗口 | 5174 |
| `pnpm run dev` | Vite 开发服务器（HMR） | 5174 |
| `pnpm run build` | TypeScript 编译 + Vite 打包 | - |
| `pnpm run preview` | 预览生产构建 | 4174 |
| `pnpm run electron:preview` | 构建后用 Electron 打开生产产物 | - |
| `pnpm run typecheck` | TypeScript 类型检查 | - |
| `pnpm run electron:package` | 打包当前平台安装包 | - |
| `pnpm run electron:package:win` | 打包 Windows 安装包 | - |
| `pnpm run electron:package:mac` | 打包 macOS 安装包 | - |
| `pnpm run electron:package:linux` | 打包 Linux 安装包 | - |

## 运行环境

| 要求 | 说明 |
|------|------|
| Node.js | ≥ 18 |
| 包管理器 | pnpm（推荐） |
| 操作系统 | macOS 11+ / Windows 10+ / Linux |

### Windows 兼容性

项目已做 Windows 适配：

- 主进程 `index.ts` 通过 `process.platform` 区分 macOS/Windows，Windows 下启用 `backgroundMaterial: "mica"` 云母效果、隐藏菜单栏
- 开发脚本 `run-electron-dev.cjs` 自动识别 Windows 平台使用 `.cmd` 可执行文件
- `shell.openPath` + `shell.openExternal` 回退机制兼容各平台文件打开
- 文件路径处理包含 `\\` → `/` 规范化，兼容 Windows 反斜杠
- `window-all-closed` 在非 macOS 平台自动退出应用

### Electron 下载问题

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm rebuild electron
```

## 源码结构

```text
frontend/
  src/
    app/                      # App 入口、路由配置
    layouts/                  # 布局组件
      AppShell.tsx            # 全局外壳（三栏 Grid、顶部栏、右侧栏宽度状态）
      Sidebar.tsx             # 左侧导航栏
      WindowTitleBar.tsx      # 统一顶部工具栏
      ConversationHistoryPanel.tsx # 首页对话历史栏
      conversationTypes.ts     # 会话展示类型
      AssistantPanel.tsx      # 右侧 AI 助手面板
      LocalResourcePopover.tsx # 首页右侧本机资源概览
      AssistantPanelContext.tsx  # 助手面板状态上下文
    pages/                    # 页面组件
      HomePage.tsx            # 首页（AI 输入 + 资源概览）
      ProjectsPage.tsx        # 项目列表
      TasksPage.tsx           # 训练/部署任务列表
      DataPage.tsx            # 数据集列表
      ModelsPage.tsx          # 模型资产列表
      SettingsPage.tsx        # 设置页（环境/AI 助手/个人信息，含所有弹窗）
    components/               # 通用组件
      StatusBadge.tsx         # 状态标签
      PromptToolbar.tsx       # AI 助手提示词工具栏
    features/                 # 业务 Feature（按领域划分，规划中）
    hooks/                    # 共享 Hooks（规划中）
    services/                 # API / IPC 服务层
      environmentsApi.ts      # 运行环境列表、创建、导入、删除接口
      assistantModelsApi.ts   # AI 助手模型配置 CRUD、默认模型、连接测试
      chatApi.ts              # 聊天流、运行时模型切换、会话接口
    stores/                   # 全局状态 Store（规划中）
    types/                    # TypeScript 类型
      domain.ts               # 核心领域类型
      ysyDesktop.d.ts         # Electron 预加载 API 类型声明
    mocks/                    # Mock 原型数据
      prototypeData.ts        # 环境/模型/项目 mock 数据
    styles/                   # 全局样式
      globals.css             # 全局样式
      tokens.css              # 设计 Token
    main.tsx                  # 渲染入口
  electron/
    main/                     # Electron 主进程
      index.ts / index.js
    preload/                  # 预加载脚本
      index.ts / index.js
  scripts/
    run-electron-dev.cjs      # Electron 开发启动脚本
  index.html                  # HTML 入口
  vite.config.ts              # Vite 配置
  tsconfig.json               # TypeScript 配置
  package.json                # 前端依赖与脚本
```

## 功能概览

### 设置页（SettingsPage）

设置页包含三大 Tab：环境、AI 助手、个人信息。

**环境 Tab**：
- 环境卡片列表来自环境业务后端 `GET /api/environments`
- 创建环境弹窗支持系统环境、导入本地环境、自定义环境
- 系统环境创建当前按后端契约只支持“大模型推理 / LLM”，提交 `mode=system`、`category=llm_inference`、`taskType=llm`
- 自定义环境创建提交 `mode=custom`、`packageManager`、`savePath`、`dependencyFilePath`、`confirmed=true`
- 创建环境请求会带 `Idempotency-Key`，后端返回环境摘要和后台创建任务摘要
- 导入本地环境只登记路径和解释器信息，不复制或修改已有环境
- 删除环境会传 `confirmed=true`，并根据后端返回的 `canDeleteLocalFiles` 控制是否允许删除本地 Conda 环境
- 检测环境入口保留；当前运行中的 `8000` OpenAPI 暂未暴露 `/api/environments/{envId}/check` 时会提示后端暂未开放

**AI 助手 Tab**：
- 模型卡片列表，支持按名称/厂商搜索过滤
- 点击卡片弹出详情弹窗：链接信息（API Base URL、模型标识、脱敏 API Key、连接状态）+ 生成参数
- 添加模型弹窗：填写模型信息 + 生成参数表单，保存后写入列表
- 编辑模型弹窗：修改已有模型配置
- 模型删除确认弹窗
- 连接测试 / 检测模型：统一弹出页面顶部 toast（不走 AI 对话栏）
- API Key 隐私保护：仅展示 `sk-` 前缀和末尾 5 个字符
- 首页和右侧助手工具栏的模型选择来自后端模型列表，仅展示可用模型；选择模型会调用运行时切换接口

**弹窗行为**：
- 所有弹窗（确认删除、创建环境、模型详情/编辑/添加）仅覆盖中间主内容区
- 左侧导航栏和右侧 AI 对话栏不受弹窗影响，仍可正常操作

### 布局

- 三栏布局：左侧导航栏（78px）| 中间工作区 | 右侧面板（354px，可拖拽调整 320-460px）
- 顶部栏：首页显示历史对话/新对话/资源入口，其他模块显示模块名
- 侧边栏可收起/展开（动画过渡）
- 右侧上下文栏：首页显示资源概览，其他模块显示 AI 助手

## 桌面壳约定

- Windows/macOS 使用系统原生标题栏
- 初始最小窗口尺寸 `1100×720`
- 外部链接交给系统浏览器打开
- `contextIsolation: true`，`nodeIntegration: false`，`sandbox: true`

## 安全规则

- preload 只通过 `contextBridge` 暴露最小 API，不暴露整个 `ipcRenderer`
- 渲染进程不得直接访问 Node.js API、文件系统或子进程
- IPC 通道使用 `namespace:action` 格式
- 本地文件操作必须路径规范化和范围校验
- 禁止明文存储或输出 token、密码、API Key、secret 和敏感路径

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5.8（严格模式） |
| 构建 | Vite 7 |
| 桌面 | Electron 33 |
| 图标 | lucide-react |
| 测试 | Playwright（规划中） |

## 前端口

| 端口 | 用途 |
|------|------|
| 5174 | Vite 开发服务器 |
| 4174 | Vite 预览服务器 |

## 后端联调

| 项 | 默认值 |
|----|--------|
| AI / chat API Base | `http://10.0.1.5:8765` |
| 环境业务 API Base | `http://10.0.1.5:8000` |
| 通用覆盖变量 | `VITE_API_BASE_URL` |
| 环境覆盖变量 | `VITE_ENVIRONMENTS_API_BASE_URL` |
| 环境列表 | `GET /api/environments` |
| 创建环境 | `POST /api/environments` + `Idempotency-Key` |
| 导入本地环境 | `POST /api/environments/import` |
| 删除环境 | `DELETE /api/environments/{envId}` |
| 模型列表 | `GET /api/settings/assistant/models` |
| 运行时模型切换 | `POST /api/runtime/model` |
| 聊天流 | `POST /api/chat/stream` |

开发环境请求会优先访问对应 `API Base`。如果浏览器或 Electron 渲染进程因 CORS / 网络策略无法直连，会回退到同源 `/api/...`，由 Vite proxy 转发到后端。`/api/environments` 和 `/api/health` 代理到 `8000`，其他 `/api` 默认代理到 `8765`。

## 打包安装包

使用 `electron-builder` 生成桌面安装包。

```bash
# 打包当前平台
pnpm run electron:package

# 仅打包 Windows（需在 Windows 上运行）
pnpm run electron:package:win

# 仅打包 macOS
pnpm run electron:package:mac

# 仅打包 Linux
pnpm run electron:package:linux
```

**输出目录**：`release/`

| 平台 | 产物 |
|------|------|
| Windows | `.exe` 安装包（NSIS）+ `.exe` 便携版 |
| macOS | `.dmg` 磁盘映像（x64 + arm64） |
| Linux | `.AppImage` 可执行文件 |

> **注意**：Windows 安装包需要在 Windows 系统上构建（NSIS 依赖）。在 macOS 上交叉编译 Windows 包需要额外配置 Wine。建议在各目标平台原生构建。
