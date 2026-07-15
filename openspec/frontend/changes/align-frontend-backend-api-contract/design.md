# Design

## 已确认决策

1. 项目模块接入全部以后端新版文档为准。
2. 项目编辑功能保留，但当前阶段暂不处理，只预留位置。
3. 当前阶段只针对项目模块，不处理其他模块问题。

## 接入原则

1. 后端接口文档优先于前端旧接口替换文档和 mock 字段。
2. 前端服务层统一解析 `success/data/error/requestId` 响应包裹。
3. 页面组件不直接拼接请求细节，统一通过 service 或 feature hook 调用。
4. 项目创建和删除必须走确认流程，并传后端要求的 `confirmed`。
5. 项目编辑不新增临时接口，不发起旧版 `PATCH /api/projects/{projectId}`。
6. 当前阶段只落地项目接口 2.1-2.5。

## 分阶段方案

### Phase 1: 项目契约与客户端基础

- 建立或复用统一 API client：base URL、请求包裹、错误映射、取消、超时。
- 建立项目类型：分页、统一响应、统一错误、项目状态、项目规格、项目摘要、项目详情。
- 定义项目 `status` 到 UI tone 的映射，展示文案使用后端 `statusText`。

### Phase 2: 项目低风险读接口

- `GET /api/projects`：项目列表、筛选、分页。
- `GET /api/projects/specs`：创建项目表单选项。
- `GET /api/projects/{projectId}`：项目详情基础信息。

### Phase 3: 项目中风险写接口

- `POST /api/projects`：创建项目。
- 提交前展示项目名称、类型、工作区、默认环境摘要。
- 请求体只包含后端新版字段：`name`、`type`、`description`、`workspace`、`environmentId`、`confirmed=true`。

### Phase 4: 项目高风险动作接口

- `DELETE /api/projects/{projectId}`：删除项目。
- 删除默认只删除登记记录并解除关联，不删除本地文件。
- 请求体传 `confirmed=true`、`deleteLocalFiles=false`。

### Phase 5: 项目页面替换与验收

- 项目列表从 mock 替换为项目服务层。
- 创建项目弹窗接入规格接口和创建接口。
- 项目详情接入详情接口；关联数据、任务、模型暂不在本阶段实现。
- 项目编辑入口保留禁用态或“待接入”占位，不提交请求。
- 补齐 loading、empty、error、confirm、retry 状态。

## 需要明确的契约差异

- 项目编辑功能保留，但新版后端项目章节未列出编辑接口；当前阶段只预留位置，不实现请求。
- 项目详情中的关联数据、任务、模型列表复用其他模块接口；当前阶段只做项目详情基础信息。
- 本地目录选择暂按现有前端能力或已确认入口处理；若项目创建工作区需要后端路径校验，另开问题确认。
