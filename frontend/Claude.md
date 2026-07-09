# frontend/AGENTS.md

本文件给 Codex、Claude Code、OpenCode 等智能体说明 `frontend/` 前端工作规则。目标是简洁、可执行；如与用户本轮指令或 OpenSpec 冲突，先暂停并标注“待确认”。

## 项目注意点

- 项目：`ysy_desktop`，本地深度学习实验和轻量大模型工作流桌面应用。
- 前端范围：只负责 `frontend/` 下 React + TypeScript + Electron + Vite 相关代码、前端文档、前端验收记录和必要共享契约。
- 前端不得越权决定后端、AI 助手、全局系统边界或非前端 OpenSpec。
- 前端 OpenSpec 固定读取 `/Users/lingluo/Desktop/ysy_desktop-main/openspec/frontend/`。
- 前端需求变更读取 `openspec/frontend/changes/<change-id>/`。
- 前端全局规则读取 `openspec/frontend/global/global.spec.md`。
- 前端模块规则读取 `openspec/frontend/modules/frontend.spec.md`。
- 当前仓库不再使用 `docs/specs/`；不要重新创建平行 specs 目录。

## 必读顺序

前端工作前按顺序读取：

1. `README.md`
2. `docs/prd/V1.0 PRD.md`
3. `docs/development/openspec-workflow.md`
4. `docs/development/ai-coding-rules.md`
5. `openspec/frontend/global/global.spec.md`
6. `openspec/frontend/modules/frontend.spec.md`
7. 当前任务对应的 `openspec/frontend/changes/<change-id>/`
8. `frontend/README.md`
9. `frontend/AGENTS.md`
10. 用户本轮提供的接口文档、设计说明或验收记录
11. 相关前端代码和测试

路径不存在时记录“未找到/待确认”，不要擅自补造目录或规范。

## 优先级

1. 用户本轮明确指令。
2. `openspec/frontend/global/global.spec.md`。
3. `openspec/frontend/modules/frontend.spec.md`。
4. 当前 Change。
5. `frontend/AGENTS.md`、`frontend/README.md`。
6. PRD、开发文档、架构文档。
7. 现有代码和测试。

多个来源冲突时，不要自行合并，记录冲突并等待确认。

## 可以做 / 先确认

可以主动做：

- 阅读、搜索、梳理前端相关文档和代码。
- 修正明显错别字、格式问题、重复描述和路径引用。
- 整理前端任务、验收记录、风险和待确认点。
- 做只读检查和非破坏性验证。

必须先确认：

- 改变目标、范围、优先级、里程碑或验收标准。
- 初始化工程、安装依赖、联网下载、引入新工具或改技术选型。
- 新增、删除、合并、重命名重要页面、模块、目录或文档结构。
- 改接口、数据结构、状态命名、错误码、IPC 通道或协作口径。
- 把 mock、占位交互或临时方案当作正式方案。
- 大范围重写、移动、删除、覆盖已有内容。
- 执行 git 提交、合并、rebase、reset、tag、发布等操作。

## OpenSpec 流程

- 正式需求遵循：先写 spec -> 再开发 -> 再验证 -> 再提交 git。
- 新增前端功能必须关联 `openspec/frontend/changes/<change-id>/`。
- 开发前确认是否影响页面、路由、组件、状态、API 调用、IPC 调用、AI 助手入口、高风险动作或验收记录。
- 不直接修改 `openspec/frontend/global/`、`openspec/frontend/modules/`，除非用户明确要求或当前 Change 已说明原因、影响和验证方式。

## 前端架构

推荐结构：

```text
frontend/
  src/
    app/
    pages/
    routes/
    layouts/
    components/
    features/<domain>/     # 目录已创建（home/projects/tasks/data/models/settings），待 Feature 拆分
    hooks/
    services/api/
    services/ipc/
    stores/
    types/                # domain.ts 为核心领域类型（ProjectSummary, TaskSummary, 
                          #   RuntimeEnvironmentDetail, AssistantModelDetail 等）
    utils/
    styles/               # globals.css（全局样式）+ tokens.css（设计 Token 自定义属性）
    assets/
  electron/main/
  electron/preload/
  tests/
```

> 当前状态：`features/<domain>/` 子目录已创建但为空壳，设置页逻辑仍在 `pages/SettingsPage.tsx` 中（~673 行）。后续重构将按 Page → Feature → Hook → Component 拆分。`types/domain.ts` 集中管理领域类型，`styles/tokens.css` 提供设计 Token。

调用方向：

```text
Page / Route -> Feature -> Hook / Service / Store -> API Client -> 后端
                                                   -> IPC Client -> Electron 主进程
                         -> Component
```

核心规则：

- Page 负责路由、页面级装配和页面级错误边界。
- AppShell 负责全局三栏布局、统一顶部栏、右侧上下文栏、侧边栏折叠和右侧栏宽度状态。
- WindowTitleBar 是所有页面共享的顶部栏：首页显示历史对话、新对话、打开位置和资源概览入口；其他模块显示当前模块名和 AI 助手开关。
- 项目、任务、数据、模型、设置页不要在页面内容区重复展示与顶部栏相同的一级模块标题。
- 右侧上下文栏：首页渲染本机资源概览，其他模块渲染 AI 助手；不要在页面组件内部再次嵌套 AI 助手面板。
- Feature 组合业务流程、Hook、局部状态和组件。
- Component 只做展示和局部交互，不直接调 Service、API 或 IPC。
- Service/API 负责请求、响应解析、错误映射、取消、重试和幂等。
- IPC Client 负责安全封装渲染进程到 preload / 主进程调用。
- Store 只保存跨组件或跨页面状态，不存大量临时 UI 状态。
- feature 不直接依赖其他 feature 内部实现；共享内容下沉到公共层。

## 编码规则

- TypeScript 严格模式；禁止隐式 `any`。
- 函数组件 + Hooks，不写 class 组件。
- 组件文件 PascalCase，如 `ProjectListPage.tsx`。
- 事件处理函数以 `handle` 开头。
- API DTO、领域类型、状态枚举集中放在 `types/` 或 feature `types/`。
- 接口路径、错误码、状态枚举、IPC 通道和配置项集中定义常量。
- 优先组合，避免组件 props 过多；复杂 JSX 拆小组件。
- 公共组件、Hook、Service、Store action/selector 写中文注释，说明业务意图和边界。
- 不提交 `console.log` 调试代码，不提交 token、密码、密钥或敏感本地路径。

## 状态与 API

- 服务端状态按 TanStack Query 思路管理：缓存、失效、重取、并发、过期响应处理集中在请求层或 Hook 层。
- 全局客户端状态才进入 Zustand 或同类 Store；不要重复存服务端数据。
- 局部 UI 状态用 `useState` / `useReducer`。
- 表单必须考虑校验、提交、禁用、草稿和未保存离开确认。
- 搜索、筛选、分页等可分享状态同步到 URL。
- localStorage / sessionStorage 只存非敏感偏好；Electron 持久化走主进程安全能力。
- API 错误映射集中在 `services/api/` 或 feature API 层，不散落页面/组件。
- mock 只能辅助开发，不能替代正式接口契约。

## Electron 与安全

- `contextIsolation: true`，`nodeIntegration: false`，`sandbox: true`。
- preload 只通过 `contextBridge` 暴露最小 API，不暴露整个 `ipcRenderer`。
- 渲染进程不得直接访问 Node.js API、文件系统或子进程。
- IPC 通道使用 `namespace:action`，如 `project:list`、`file:open-dialog`。
- IPC 调用必须有参数校验、超时、错误映射和必要进度状态。
- 本地文件操作必须路径规范化和范围校验，防止路径穿越。
- 外部链接打开必须校验白名单或等待用户确认。
- AI 助手不能绕过后端直接执行 shell。
- 删除文件、覆盖配置、安装依赖、启动长任务、停止进程、暴露端口等高风险动作必须用户确认。
- 禁止明文存储或输出 token、密码、API Key、secret、环境变量和敏感路径。
- 禁止直接使用 `dangerouslySetInnerHTML`；确需使用必须审批并 sanitize。

## UI 状态

每个前端方案都要说明：

- 入口：从哪里进入，是否需要权限或前置数据。
- 过程：loading、提交、取消、重试、并发和进度。
- 反馈：成功、失败、部分成功、待确认、处理中。
- 返回：失败/取消/刷新后如何恢复。
- 下一步：成功后跳转、刷新、查看结果或继续操作。

必须覆盖 loading、empty、error、permission、cancel、retry、concurrent、offline/local 状态。AI 生成建议不得自动提交；AI 发起 `action_request` 时必须展示可审计步骤和确认入口。

## 验证要求

- 文档检查：需求、接口、状态、验收项和风险是否一致。
- 静态检查：TypeScript、lint、格式或路径检查。
- 单元测试：工具函数、状态转换、接口适配、错误映射、Hook / Service。
- 组件测试：关键交互、表单校验、加载、空态、错误、权限展示。
- IPC 测试：mock 正常返回、超时和错误，不启动真实 Electron 子进程。
- E2E：核心用户路径和跨页面流转。
- 视觉验证：布局、响应式、可访问性和文本溢出。

只做文档或静态检查时，不要说功能已通过。未启动服务、未连真实接口、未跑浏览器时，必须标注“未验证”。

## 待确认技术选型

除非 OpenSpec Change 或负责人确认，不要默认采用：

- Tailwind、Radix、ShadCN、Storybook、Plop、Sentry、Husky。
- React Hook Form、Zod。
- `@/` 绝对导入。
- 完全禁止所有 cross-feature import。

## 回复规范

- 所有回复使用中文。
- 简洁说明做了什么、验证了什么、哪些没做、需要确认什么。
- 对不确定内容标注“待确认”或“未验证”。
- 不在未获得确认时输出承诺式表述。
