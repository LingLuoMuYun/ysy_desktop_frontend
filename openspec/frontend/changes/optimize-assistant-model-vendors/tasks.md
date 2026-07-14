# Tasks: optimize-assistant-model-vendors

## 已完成任务

- [x] 阅读根级 AGENTS、前端 AGENTS、前端 Global Spec、Frontend Module Spec、PRD、开发规范和设置页相关代码。
- [x] 新增模型厂商展示名、后端值和默认 API Base URL 的统一映射。
- [x] 添加模型弹窗将 `Provider` 改为“模型厂商”，并使用固定厂商下拉菜单。
- [x] 编辑模型弹窗将 `Provider` 改为“模型厂商”，并复用固定厂商下拉菜单。
- [x] 保存添加/编辑模型时，把 `vendor` 和 `provider` 转为需求指定英文值。
- [x] 下拉菜单只展示页面厂商名，英文后端值仅用于保存 payload。

## 验证记录

- [x] `pnpm run typecheck`

## 待确认

- [ ] 后端是否最终要求 `DeepSeek` 保持大写，还是统一接收小写 `deepseek`。
