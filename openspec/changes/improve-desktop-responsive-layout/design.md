## Context

The product is a desktop AI workstation built with React, TypeScript, and Electron. The existing frontend spec requires a fixed left navigation area, a top window bar, a right AI assistant panel for most modules, and dense workstation-style pages.

Responsive work should start in the browser because layout debugging is fastest there, then be validated inside Electron because the desktop shell adds window constraints, title bar behavior, DPI differences, and resize behavior.

The primary desktop targets are Windows and macOS. The first desktop version uses the native system title bar on both platforms.

## Goals / Non-Goals

**Goals:**
- Create a desktop-first responsive layout contract.
- Make the app stable across normal desktop window sizes.
- Prevent content overlap, broken buttons, unreadable tables, and nested scroll traps.
- Give Electron a minimum window size that protects the UI from impossible layouts.
- Identify which decisions need product approval before implementation.
- Allow engineering to proceed on safe layout mechanics without waiting for every product detail.

**Non-Goals:**
- Do not create a mobile-first phone layout.
- Do not redesign the product visual language.
- Do not add new product modules or backend behavior.
- Do not optimize for windows smaller than the agreed minimum size.
- Do not change AI action, backend execution, or risk confirmation rules.
- Do not implement a frameless/custom-drawn title bar in this change.

## Decisions

### Decision: Use desktop-first breakpoints

Use desktop workstation sizes as the primary targets:

- Large: `1440px+`
- Standard: `1280px`
- Compact desktop: `1100px` to `1279px`
- Minimum supported width: `1100px` initially, adjustable after validation.
- Minimum supported height: `640px` content area after Windows title-bar validation feedback.

Alternative considered: mobile-first responsive layout. Rejected because the product is an Electron desktop workstation with dense operational screens, fixed navigation, and local execution workflows.

### Decision: Browser-first tuning, Electron-second validation

Implement and tune the core layout in the browser first, then validate inside Electron before considering the work complete.

Alternative considered: build Electron first and tune only in the packaged app. Rejected because it slows iteration and makes CSS/layout defects harder to isolate.

### Decision: Native Windows and macOS title bars

Use the native/system Electron title bar for Windows and macOS. The renderer UI should not reserve fake draggable title-bar controls, and it should not implement custom close, minimize, maximize, traffic-light, or snap behavior in this change.

Alternative considered: frameless Electron window with a custom draggable title bar. Rejected for this phase because native title bars reduce platform risk and better match the immediate goal of stabilizing responsive layout.

### Decision: App shell owns global resizing behavior

The app shell should define stable regions:

```text
┌─────────────────────────────────────────────────────────────┐
│ Unified top bar                                              │
├───────────────┬───────────────────────────────┬─────────────┤
│ Left nav      │ Main content                  │ Right panel  │
│ fixed/collap  │ flexible, owns page scrolling │ resizable    │
└───────────────┴───────────────────────────────┴─────────────┘
```

Main content should flex, while each page owns its internal scroll containers. The body/root should not become a catch-all scrolling surface for complex workstation pages.
The right panel is controlled by AppShell: it shows the local resource overview on 首页 and the AI assistant on 项目, 任务, 数据, 模型, and 设置.

### Decision: Use containment before global reflow

Prefer component/container behavior before global page reflow:

- Tables can scroll horizontally or hide secondary columns.
- Side panels can collapse, reduce width, or be resized within approved bounds.
- Toolbars can wrap into a second row only if controls remain legible.
- Modals should constrain width/height and scroll internally.

Alternative considered: scale all UI down proportionally. Rejected because it makes dense operational controls harder to read and click.

### Decision: Confirmed product decisions

The following product decisions are confirmed for the first implementation pass:

- Engineering will define the initial Electron minimum width and height, then adjust after validation.
- The right context panel remains a third column when opened and can be resized by dragging. It hosts 本机资源概览 on 首页 and AI 助手 on other modules.
- The left navigation becomes icon-only at compact desktop widths and may fully collapse at narrower widths if needed.
- Responsive cleanup follows the module order: 首页, 项目, 任务, 数据, 模型, 设置.
- Project, task, data, model, and settings pages share the same top bar and right context panel foundation as 首页.
- Dense tables use the pattern that is most common in the existing codebase; if no clear local pattern exists, horizontal scrolling is the default fallback.
- Browser-only usage below the Electron minimum size is not a supported production target.
- Windows and macOS are the main platform targets.
- The app uses native/system title bars on Windows and macOS; custom draggable title bar behavior is out of scope unless a frameless window is explicitly approved in a future change.

### Decision: Remaining user-owned decisions

These decisions may still require user or product confirmation during implementation:

- Whether the adjusted `1100px` by `640px` content minimum feels too restrictive or too loose after Windows real-window testing.
- Whether specific high-value tables need priority-column behavior instead of horizontal scrolling.
- Whether any later visual direction requires a separate frameless/custom title bar change.

### Decision: Engineering-owned decisions

These can be implemented by engineering as long as the visible behavior satisfies the spec:

- CSS layout primitives, including grid/flex usage.
- Root sizing using `100vh` or `100dvh` where appropriate.
- Scroll container placement.
- Modal max dimensions and internal scrolling.
- Button/icon wrapping and overflow behavior.
- CSS variables or layout tokens for shell dimensions.
- Playwright or equivalent viewport checks.
- Electron `BrowserWindow` enforcement once minimum sizes are approved.
- Windows and macOS Electron validation coverage.

## Risks / Trade-offs

- [Risk] A minimum width or height that is too large may feel restrictive on small laptops. -> Mitigation: use a `1100px` by `640px` content minimum and revise after validation.
- [Risk] A resizable right panel may reduce available workspace width. -> Mitigation: clamp panel width and keep the main content column flexible.
- [Risk] Tables and logs may remain readable but require horizontal scrolling. -> Mitigation: identify per-page priority columns and use horizontal scrolling as the default fallback.
- [Risk] Browser tuning can miss Electron title bar, platform chrome, DPI, and resize differences. -> Mitigation: require Electron validation on Windows and macOS before marking implementation complete.
- [Risk] Windows DPI scaling or a small display work area can make the preferred minimum size larger than the available screen, causing the native maximize button to be disabled. -> Mitigation: clamp Electron initial and minimum content sizes to the active display work area and explicitly keep the window resizable/maximizable.
- [Risk] Too many page-specific fixes can fragment the layout system or conflict with unfinished page structures. -> Mitigation: first create shared shell/layout rules, finish 首页, and limit other pages to low-risk safeguards until their structure is complete.

## Open Questions

1. Do any specific tables need priority-column hiding instead of the common/default table behavior?
2. After Windows Electron validation, should the adjusted `1100px` by `640px` content minimum be changed again?
