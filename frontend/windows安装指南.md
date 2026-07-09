# Windows 安装与打包指南

本文档用于在 Windows 环境安装依赖、运行开发版、打包生成安装程序。

## 环境要求

- Windows 10 或 Windows 11，64 位系统
- Node.js 20 LTS 或更新的 LTS 版本
- pnpm 10 或 11
- PowerShell、Windows Terminal 或 CMD

安装 pnpm：

```powershell
npm install -g pnpm
```

确认版本：

```powershell
node -v
pnpm -v
```

## 进入正确目录

打包命令必须在 `frontend` 目录运行。项目解压后，请先进入包含 `frontend/package.json` 的目录：

```powershell
cd C:\Users\idr\Downloads\ysy_desktop_frontend-main\ysy_desktop_frontend-main\frontend
```

如果不确定目录位置，可以搜索：

```powershell
Get-ChildItem -Recurse -Filter "package.json" | Select-Object FullName
```

看到 `frontend\package.json` 后，进入它所在目录。

## 处理 PowerShell 执行策略

如果出现：

```text
pnpm.ps1，因为在此系统上禁止运行脚本
```

在当前 PowerShell 会话临时放行：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

或者对当前用户长期放行：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

也可以改用 CMD 运行同样命令，CMD 不会触发 `pnpm.ps1` 执行策略问题。

## 安装依赖

在 `frontend` 目录运行：

```powershell
pnpm install
```

项目已在 `pnpm-workspace.yaml` 中允许 Electron 打包所需的构建脚本：

- `electron`
- `electron-winstaller`
- `esbuild`

如果 pnpm 仍提示 `Ignored build scripts`，运行：

```powershell
pnpm approve-builds
```

在交互界面中用空格选择 Electron 相关包，回车确认，然后重新安装：

```powershell
pnpm install
```

## 本地开发运行

启动 Electron 开发版：

```powershell
pnpm run electron:dev
```

只启动前端网页开发服务：

```powershell
pnpm run dev
```

## Windows 打包

在 `frontend` 目录运行：

```powershell
pnpm run electron:package:win
```

成功后产物位于：

```text
frontend\release
```

默认会生成：

- NSIS 安装包
- portable 免安装版本

## 常见问题

### No package.json found

原因：命令不在 `frontend` 目录运行。

解决：

```powershell
cd path\to\project\frontend
pnpm run electron:package:win
```

### electron is only allowed in devDependencies

原因：`electron-builder` 要求 `electron` 放在 `devDependencies`，不能放在 `dependencies`。

本项目已修复：`electron` 已移动到 `devDependencies`。如果仍看到该错误，请确认使用的是最新代码，并重新安装依赖：

```powershell
pnpm install
```

### Ignored build scripts: electron-winstaller

原因：pnpm 安全策略阻止依赖执行构建脚本。

解决：

```powershell
pnpm approve-builds
pnpm install
pnpm run electron:package:win
```

### 网络下载很慢或失败

可以临时切换 npm 镜像：

```powershell
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

恢复官方源：

```powershell
pnpm config set registry https://registry.npmjs.org
```

### 重新干净安装

如果依赖状态混乱，可以删除依赖目录后重新安装：

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

不要随意删除 `pnpm-lock.yaml`，除非明确需要重新生成锁文件。

## 推荐完整流程

```powershell
cd path\to\project\frontend
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
pnpm install
pnpm run electron:package:win
```

如果出现构建脚本拦截：

```powershell
pnpm approve-builds
pnpm install
pnpm run electron:package:win
```
