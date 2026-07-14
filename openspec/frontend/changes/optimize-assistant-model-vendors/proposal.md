# Proposal: optimize-assistant-model-vendors

## 背景

设置页 AI 助手添加模型和编辑模型仍使用 `Provider` 文案，并保留了过多 provider 候选。当前需求要求前端把 Provider 调整为“模型厂商”，页面展示中文厂商名，但提交给后端时使用指定英文厂商值，并按厂商自动带入对应 API Base URL。

## 目标

1. 添加模型和编辑模型弹窗中，`Provider` 改为“模型厂商”。
2. 模型厂商下拉菜单仅展示本需求指定厂商。
3. 页面 UI 展示中文厂商名；`DeepSeek`、`minimax`、`custom` 保持英文展示。
4. 提交给后端的 `vendor` 和 `provider` 使用指定英文名称。
5. 选择模型厂商时自动填入对应 API Base URL；`custom` 不提供默认 URL。

## 非目标

- 不修改后端接口路径和响应结构。
- 不新增 API Key 校验逻辑。
- 不改变连接测试、默认模型和运行时模型切换行为。
- 不新增高风险本机操作。

## 影响范围

- `frontend/src/services/assistantModelsApi.ts`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/styles/globals.css`

## 风险等级

中风险：新增或修改 AI 助手模型配置记录，但不启动进程、不修改本机文件、不修改运行环境。

## 验收标准

- 添加模型和编辑模型弹窗显示“模型厂商”，不再显示 `Provider`。
- 下拉菜单只显示：硅基流动、火山引擎、DeepSeek、智谱、阿里云、月之暗面、minimax、阶跃星辰、小米、custom，不显示后端英文值。
- 选择各厂商后自动带入需求指定 API Base URL；选择 `custom` 时 URL 为空。
- 保存时传给后端的 `vendor` 和 `provider` 为指定英文值，例如 `siliconflow`、`volcengine`、`DeepSeek`、`dashscope`。
- `pnpm run typecheck` 通过或记录未通过原因。
