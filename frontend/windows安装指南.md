# Windows 安装与使用指南

本文档涵盖"桌面智算"桌面应用的安装、使用、卸载和开发者构建流程。

---

## 一、面向最终用户：安装已打包的程序

### 1.1 获取安装包

从项目发布页面下载最新版本，有两种格式可选：

| 文件 | 说明 |
|------|------|
| `桌面智算 Setup x.x.x.exe` | NSIS 安装程序，**推荐**。带安装向导，可创建桌面和开始菜单快捷方式 |
| `桌面智算 x.x.x.exe` | 便携版，免安装。直接双击运行，可放入 U 盘携带 |

> **推荐选择 NSIS 安装程序**（带 Setup 字样），可获得完整的开始菜单快捷方式和卸载入口。

### 1.2 安装步骤

1. 双击运行 `桌面智算 Setup x.x.x.exe`
2. 如果出现 **"Windows 已保护你的电脑"（SmartScreen）** 警告：
   - 点击 **"更多信息"**
   - 点击 **"仍要运行"**
   - > 原因：应用暂未购买代码签名证书，Windows 会对未签名应用弹出安全提示。这是正常现象，不影响使用。
3. 选择安装语言（简体中文），点击"确定"
4. 选择安装路径：
   - 默认：`C:\Users\<用户名>\AppData\Local\Programs\桌面智算`
   - 可点击"浏览"自定义安装目录
5. 勾选"创建桌面快捷方式"（默认已勾选）
6. 点击"安装"，等待进度条完成
7. 安装完成后，勾选"运行桌面智算"可立即启动，或点击"完成"关闭安装向导

### 1.3 安装位置与数据存储

| 内容 | 路径 | 说明 |
|------|------|------|
| 程序文件 | `%LOCALAPPDATA%\Programs\桌面智算\` | 或自定义安装路径 |
| 桌面快捷方式 | `桌面\桌面智算.lnk` | |
| 开始菜单 | `开始菜单\桌面智算\` | 含启动快捷方式和卸载入口 |
| 用户数据 | `%APPDATA%\桌面智算\` | 配置、缓存、运行时数据 |
| 日志文件 | `%APPDATA%\桌面智算\logs\` | 调试日志 |

> **注意**：卸载程序时**不会自动删除** `%APPDATA%\桌面智算\` 中的用户数据。如需彻底清除，请手动删除该目录。

### 1.4 启动应用

安装完成后可通过以下任意方式启动：

- 双击桌面上的 **"桌面智算"** 快捷方式
- 开始菜单 → **桌面智算** → **桌面智算**
- 在安装目录中双击 `桌面智算.exe`

### 1.5 卸载方法

#### 方法一（推荐）：开始菜单卸载
开始菜单 → **桌面智算** → 右键点击 **"卸载"** → 在弹出的卸载向导中确认

#### 方法二：控制面板
控制面板 → 程序和功能 → 找到 **"桌面智算"** → 右键卸载

#### 方法三：Windows 设置
Windows 设置 → 应用 → 已安装的应用 → 搜索 **"桌面智算"** → 点击卸载

#### 彻底清除残留数据
卸载完成后，如需彻底清除所有数据：
1. 打开文件资源管理器
2. 地址栏输入 `%APPDATA%` 并回车
3. 删除 `桌面智算` 文件夹
4. （可选）地址栏输入 `%LOCALAPPDATA%\Programs` 并回车，删除残留的 `桌面智算` 文件夹

### 1.6 便携版使用

- 下载 `桌面智算 x.x.x.exe`（不含 Setup 字样）
- 双击直接运行，无需安装
- 程序启动后在当前目录创建用户数据
- 适合放在 U 盘中多台电脑使用
- 删除便携版 exe 即完成"卸载"

---

## 二、面向开发者：从源码构建

### 2.1 环境要求

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

### 2.2 进入正确目录

打包命令必须在 `frontend` 目录运行。项目解压后，请先进入包含 `frontend/package.json` 的目录：

```powershell
cd C:\Users\idr\Downloads\ysy_desktop-main\frontend
```

如果不确定目录位置，可以搜索：

```powershell
Get-ChildItem -Recurse -Filter "package.json" | Select-Object FullName
```

看到 `frontend\package.json` 后，进入它所在目录。

### 2.3 处理 PowerShell 执行策略

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

### 2.4 安装依赖

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

### 2.5 本地开发运行

启动 Electron 开发版（Vite 热更新 + Electron 窗口）：

```powershell
pnpm run electron:dev
```

只启动前端网页开发服务（浏览器访问）：

```powershell
pnpm run dev
```

### 2.6 Windows 打包

在 `frontend` 目录运行：

```powershell
pnpm run electron:package:win
```

成功后产物位于：

```text
frontend\release\
```

生成文件说明：

| 文件 | 说明 |
|------|------|
| `桌面智算 Setup x.x.x.exe` | NSIS 安装程序，推荐分发此文件 |
| `桌面智算 x.x.x.exe` | portable 便携版，免安装 |
| `builder-effective-config.yaml` | 实际生效的 electron-builder 配置 |
| `latest.yml` | 版本信息（用于自动更新） |

---

## 三、常见问题

### 3.1 安装时提示 "Windows 已保护你的电脑"

**解决方法**：点击 **"更多信息"** → **"仍要运行"**。

这是正常提示，因为应用未购买代码签名证书（EV Code Signing Certificate）。如需彻底消除此提示，需要购买 EV 代码签名证书（约 $200–400/年）并对安装包签名。

### 3.2 杀毒软件误报或拦截

部分杀毒软件可能将 Electron 打包程序误报为可疑文件。

- 将文件上传到 [VirusTotal](https://www.virustotal.com) 在线检测
- 如确认为误报，在杀毒软件中将安装目录加入白名单
- 这是 Electron 应用的常见情况，非安全问题

### 3.3 安装后启动无响应或白屏

可能原因和排查步骤：

1. **从旧版本升级** → 先卸载旧版本，重启电脑，再安装新版本
2. **用户数据损坏** → 删除 `%APPDATA%\桌面智算\` 目录后重试
3. **VC++ 运行库缺失** → 从微软官网下载安装 [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)（2015-2022 版本）
4. **权限不足** → 右键以管理员身份运行

### 3.4 启动报错 "VCRUNTIME140.dll 未找到" 或 "MSVCP140.dll 未找到"

安装 Visual C++ Redistributable：

- 下载地址：[https://aka.ms/vs/17/release/vc_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe)
- 下载后双击安装，重启电脑

### 3.5 如何完全清除数据重新安装

```powershell
# 1. 卸载应用（控制面板 → 程序和功能 → 桌面智算 → 卸载）
# 2. 删除用户数据目录
Remove-Item -Recurse -Force "$env:APPDATA\桌面智算"
# 3. 删除程序残留（如存在）
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Programs\桌面智算"
# 4. 重新运行安装程序
```

### 3.6 开发者：No package.json found

原因：命令不在 `frontend` 目录运行。

解决：

```powershell
cd path\to\project\frontend
pnpm run electron:package:win
```

### 3.7 开发者：electron is only allowed in devDependencies

原因：`electron-builder` 要求 `electron` 放在 `devDependencies`，不能放在 `dependencies`。

本项目已修复：`electron` 已移动到 `devDependencies`。如果仍看到该错误，请确认使用的是最新代码，并重新安装依赖：

```powershell
pnpm install
```

### 3.8 开发者：Ignored build scripts: electron-winstaller

原因：pnpm 安全策略阻止依赖执行构建脚本。

解决：

```powershell
pnpm approve-builds
pnpm install
pnpm run electron:package:win
```

### 3.9 开发者：网络下载很慢或失败

可以临时切换 npm 镜像：

```powershell
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

恢复官方源：

```powershell
pnpm config set registry https://registry.npmjs.org
```

### 3.10 开发者：重新干净安装依赖

如果依赖状态混乱，可以删除依赖目录后重新安装：

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

> **不要随意删除 `pnpm-lock.yaml`**，除非明确需要重新生成锁文件。

---

## 四、推荐完整流程

### 终端用户安装

```powershell
# 1. 下载 桌面智算 Setup x.x.x.exe
# 2. 双击运行，如遇 SmartScreen 点击"更多信息"→"仍要运行"
# 3. 选择安装路径 → 勾选桌面快捷方式 → 安装 → 完成
# 4. 双击桌面快捷方式启动
```

### 开发者构建打包

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
