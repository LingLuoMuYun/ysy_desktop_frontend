## Verification

### Automated Checks

- `pnpm run typecheck`: passed.
- `pnpm run build`: passed.
- `pnpm run electron:dev`: launched the Electron dev process and kept running until manually stopped.
- Electron window sizing was adjusted to `useContentSize: true`, initial content size `1180x700`, and minimum content size `1100x640` to avoid Windows native title bar chrome reducing the usable renderer area.
- Electron window creation now clamps initial and minimum content sizes to the active display work area and explicitly enables `resizable`, `maximizable`, and `fullscreenable` so the Windows maximize control does not become disabled on constrained displays.

### Browser Responsive Checks

Validated through the in-app browser against the local Vite server at `http://localhost:5175/`.

Checked viewports:

- 首页 at `1100x720`
- 首页 at `1280x760`
- 首页 at `1440x900`
- 任务 at `1100x720`
- 设置 at `1100x720`

Observed results:

- No body-level horizontal overflow in checked viewports.
- 首页 headline and prompt remained visible at the minimum supported size.
- Left navigation became icon-only near the minimum supported width.
- Right context panel rendered as the third column when opened and did not overlap the main content.
- 首页 resource overview and non-首页 AI assistant share the same right panel width contract.
- Top bar displayed 首页-specific controls on 首页 and module labels plus AI assistant toggle on other modules.
- Duplicate module titles were removed from 项目, 任务, 数据, 模型, and 设置 content areas.
- Existing task/settings card action areas stacked below content at compact width.

### Sidebar Collapse Feature (Manual Toggle)

- CSS rules for `.app-window--menu-collapsed` added to `globals.css`: sidebar column shrinks from `78px` to `0` with `0.25s ease` transition on `grid-template-columns`, `width`, `padding`, `opacity`, and `border-width`.
- Combination variants handled: collapsed + assistant-closed, collapsed + settings page.
- Reusable `SidebarToggle` component created in `components/SidebarToggle.tsx`, using `PanelLeftClose` / `PanelLeftOpen` icon swap from Lucide.
- `SidebarToggle` is provided by the shared `WindowTitleBar` for all six pages.
- `page-header__left` CSS class added for consistent header layout across workbench pages.
- `SettingsPage` no longer embeds its own assistant panel; AppShell renders the shared right AI panel.

### Right Context Panel

- `AppShell` owns the third-column right context panel and exposes a bounded width CSS variable.
- 首页 opens `LocalResourcePopover` from the resource overview button in the top bar.
- 项目, 任务, 数据, 模型, 设置 render `AssistantPanel` in the same right column.
- The resize handle uses the same width state for resource overview and AI assistant panels.

### Remaining Verification Debt

- Electron launched successfully on macOS, manual resize inspection performed — sidebar collapse toggle works correctly across all pages.
- Windows native title bar behavior still needs validation on Windows.
