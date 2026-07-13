# Windows 应用图标替换

## 背景

用户希望 Windows 窗口、任务栏和安装包图标也使用提供的应用图标图片，而不是旧的 `icon.ico` / `icon.png`。

## 目标

- 使用用户提供的 PNG 重新生成 `frontend/resources/icon.ico`。
- 使用用户提供的 PNG 替换 `frontend/resources/icon.png`。
- Electron 运行时窗口图标使用 `resources/icon.ico`。
- 侧边栏品牌图标使用同一图片资源，保持应用内外图标一致。

## 非目标

- 不执行安装包构建。
- 不修改应用名称、窗口标题或产品标识。
- 不处理 macOS `.icns` 图标。

## 风险等级

低风险。仅替换静态图标资源和 Electron 图标路径。

## 验收标准

- `frontend/resources/icon.ico` 和 `frontend/resources/icon.png` 均来自用户提供的图标。
- Electron 主进程窗口图标路径指向 `resources/icon.ico`。
- TypeScript 类型检查通过。
