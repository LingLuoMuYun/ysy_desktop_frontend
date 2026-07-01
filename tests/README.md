# tests

集成测试、端到端测试和验收用例目录。

建议结构：

```text
tests/
  integration/
  e2e/
  acceptance/
```

测试要求：

- 后端变更至少覆盖接口或服务层行为。
- AI 编排变更至少覆盖成功、缺参和失败场景。
- 前端关键工作流需要端到端或浏览器验证。
- 验收用例必须能回溯到 OpenSpec Change。
