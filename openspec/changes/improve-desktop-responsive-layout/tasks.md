## 1. Product Decisions

- [x] 1.1 Use engineering-defined initial Electron minimum size, starting at `1100px` by `720px` and revising to `1100px` by `640px` content size after validation feedback.
- [x] 1.2 Keep the right context panel as an opened third column and support drag resize within bounded widths.
- [x] 1.3 Make the left navigation icon-only at compact desktop widths, then fully collapsible if space gets tighter.
- [x] 1.4 Start responsive cleanup from 首页, then extend shared shell behavior to 项目、任务、数据、模型、设置.
- [x] 1.5 Use the most common existing table narrow-width pattern, with horizontal scrolling as the default if no clear pattern exists.
- [x] 1.6 Treat Electron as the production target; browser-only usage below the Electron minimum is not supported.
- [x] 1.7 Use native/system title bars on Windows and macOS; custom draggable title bar behavior is out of scope for this change.
- [x] 1.8 Use module order for future page cleanup: 首页, 项目, 任务, 数据, 模型, 设置.
- [x] 1.9 Apply shared layout foundation, right context panel behavior, and duplicate-title cleanup to all six pages.

## 2. Layout Audit

- [x] 2.1 Locate the current app shell, routing layout, sidebar, top bar, and AI assistant panel implementation.
- [x] 2.2 Identify pages with fixed width, fixed height, viewport overflow, or nested scroll risks.
- [x] 2.3 Identify tables, logs, editors, forms, modals, and drawers that need responsive treatment.
- [x] 2.4 Record the highest-risk layout issues before implementation.

## 3. Shared Layout Foundation

- [x] 3.1 Define shared layout tokens for shell heights, sidebar widths, assistant widths, content gaps, and supported breakpoints.
- [x] 3.2 Update the root app container to use stable viewport height and bounded workspace regions.
- [x] 3.3 Update the app shell so fixed regions remain stable while main content flexes.
- [x] 3.4 Ensure page content scrolls inside intended regions rather than uncontrolled body scrolling.

## 4. Shell Responsive Behavior

- [x] 4.1 Implement approved compact behavior for the left navigation.
- [x] 4.2 Implement the right context panel as a shared resizable column for 首页 resources and non-首页 AI assistant.
- [x] 4.3 Implement manual sidebar collapse toggle (SidebarToggle component, CSS transitions for .app-window--menu-collapsed, shared across all six pages).
- [x] 4.4 Ensure the top window bar remains usable and does not overlap page content.
- [x] 4.5 Add or update Electron minimum window size constraints using the adjusted `1100px` by `640px` content-size contract.
- [x] 4.6 Confirm the Electron shell uses native/system title bars on Windows and macOS.

## 5. Page-Level Cleanup

- [x] 5.1 Apply responsive fixes to 首页.
- [x] 5.2 Ensure 首页 remains usable at the minimum, compact desktop, standard desktop, and large desktop widths.
- [x] 5.3 Apply the shared top bar, right context panel, and duplicate-title cleanup to 项目, 任务, 数据, 模型, and 设置.
- [x] 5.4 Ensure dense tables use the approved fallback behavior where table structures already exist.
- [x] 5.5 Ensure existing modals, drawers, and confirmation dialogs fit supported desktop sizes without forcing unfinished page redesigns.

## 6. Verification

- [x] 6.1 Verify browser layouts at the approved minimum size, compact desktop, standard desktop, and large desktop widths.
- [x] 6.2 Verify Electron resizing configuration across the approved supported size range.
- [ ] 6.3 Verify native title bar behavior on Windows and macOS, including window controls and available content area.
- [x] 6.4 Check that primary workflows remain usable without incoherent overlap.
- [x] 6.5 Run available frontend checks or tests.
- [x] 6.6 Document any remaining page-specific responsive debt.
