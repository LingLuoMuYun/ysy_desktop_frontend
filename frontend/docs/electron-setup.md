# Electron Setup

This project uses Electron as the desktop shell for the React/Vite renderer.

## Development

```bash
pnpm run electron:dev
```

The command starts the Vite dev server at `http://localhost:5174`, waits until it is reachable, then launches Electron with `VITE_DEV_SERVER_URL` pointing at the dev server.

## Production Preview

```bash
pnpm run electron:preview
```

The command builds the renderer and opens the built `dist/index.html` through Electron.

## Window Policy

- Native Windows/macOS title bars are used.
- Custom draggable title bars and custom close/minimize/maximize controls are out of scope.
- The initial minimum window size is `1100x720`.
- Renderer navigation is restricted to the local dev server in development and `file://` URLs in production.
- External `http://` and `https://` links are opened through the system browser.

## Dependency Notes

- Use `pnpm install` for dependency installation.
- If pnpm blocks Electron or esbuild install scripts, approve pending builds:

```bash
pnpm approve-builds --all
```

- If Electron download is slow or incomplete, run with the mirror used by the reference project:

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm rebuild electron
```

- If a previous interrupted download leaves a partial `Electron.app`, remove the broken Electron package from `node_modules` and run the mirrored rebuild again.

## Packaging

This project uses `electron-builder` for packaging. See [windows安装指南.md](../windows安装指南.md) for complete Windows packaging and installation instructions.

Quick packaging commands:

```bash
# Windows (NSIS installer + portable)
pnpm run electron:package:win

# macOS (DMG)
pnpm run electron:package:mac

# Linux (AppImage)
pnpm run electron:package:linux
```

Build output goes to `frontend/release/`. The NSIS installer (`桌面智算 Setup x.x.x.exe`) supports custom install paths, desktop shortcuts, and start menu entries. See the [Windows installation guide](../windows安装指南.md) for end-user instructions and SmartScreen handling.

## Known Packaging Issues & Patches

### Bug 1: `ElectronDownloadCacheMode` undefined (electron-builder@26.15.3)

**Symptom:**

```
TypeError: Cannot read properties of undefined (reading 'ReadWrite')
    at resolveCacheMode (…/app-builder-lib/out/util/electronGet.js)
```

**Root cause:** `electron-builder@26.15.3` references `ElectronDownloadCacheMode` enum from `@electron/get`, but this enum does not exist in `@electron/get@3.0.0` (it was removed / never shipped).

**Fix — patch two locations in the compiled JS:**

File: `node_modules/.pnpm/app-builder-lib@26.15.3_…/node_modules/app-builder-lib/out/util/electronGet.js`

1. **Replace `resolveCacheMode()` function** — remove the reference to the missing enum:

```js
// BEFORE (broken):
function resolveCacheMode() {
    var _a;
    const varName = "ELECTRON_DOWNLOAD_CACHE_MODE";
    const cacheOverride = (_a = process.env[varName]) === null || _a === void 0 ? void 0 : _a.trim();
    if (cacheOverride && Number(cacheOverride) in get_1.ElectronDownloadCacheMode) {
        const mode = Number(cacheOverride);
        builder_util_1.log.debug({ mode }, `cache mode overridden via env var ${varName}`);
        return mode;
    }
    return get_1.ElectronDownloadCacheMode.ReadWrite;
}

// AFTER (fixed):
function resolveCacheMode() {
    return undefined;
}
```

2. **Remove `ElectronDownloadCacheMode.WriteOnly` reference** (line ~266):

```js
// BEFORE (broken):
filePath = await get.downloadArtifact({ ...configWithProgress, cacheMode: get_1.ElectronDownloadCacheMode.WriteOnly });

// AFTER (fixed):
filePath = await get.downloadArtifact({ ...configWithProgress });
```

> `cacheMode` is not recognized by `@electron/get`'s `downloadArtifact` API (it's not in the type definitions), so passing `undefined` is safe.

### Bug 2: Windows EPERM on tmp→dir rename

**Symptom:**

```
EPERM: operation not permitted, rename '…\release\win-unpacked.tmp' -> '…\release\win-unpacked'
    at extractArchive (…/app-builder-lib/out/util/electronGet.js:179:9)
```

**Root cause:** On Windows, antivirus software (e.g. Windows Defender) may hold file handles on freshly extracted Electron binaries. The `fs.rename(tmpDir, dir)` call fails because the OS won't allow the rename while handles are open.

**Fix — use `cp` + `rm` instead of `rename`:**

In the same `electronGet.js` file, inside the `extractArchive` function (end of the try block):

```js
// BEFORE (broken):
await fs.rm(dir, { recursive: true, force: true });
await fs.rename(tmpDir, dir);

// AFTER (fixed):
await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
// Use cp+rm instead of rename on Windows — AV may hold file handles on extracted contents
await fs.cp(tmpDir, dir, { recursive: true, force: true });
await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
```

### Re-applying patches after `pnpm install`

Running `pnpm install` will re-download `app-builder-lib` and overwrite the patches. After reinstalling dependencies, re-apply both patches before packaging. Alternatively, use `pnpm patch` to make patches persistent — see [pnpm patch docs](https://pnpm.io/cli/patch).

A quick script to apply both patches in one go can be found at [`frontend/scripts/patch-electron-builder.cjs`](../scripts/patch-electron-builder.cjs) (if created).

### Quick reference: full packaging command

```bash
cd frontend
# Use Chinese mirror if GitHub is unreachable
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ pnpm run electron:package:win
```
