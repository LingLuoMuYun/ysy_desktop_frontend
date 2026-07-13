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
