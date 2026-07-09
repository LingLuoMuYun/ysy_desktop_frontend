## ADDED Requirements

### Requirement: Desktop Window Size Contract
The system SHALL define and enforce a minimum supported desktop content size of `1100px` by `640px` for the Electron shell after validation showed the initial `1100px` by `720px` outer-window contract could clip content under native Windows title bar chrome.

#### Scenario: Window is resized below the minimum
- **WHEN** a user attempts to resize the Electron window below the configured minimum width or height
- **THEN** the window remains at or above the configured minimum size

#### Scenario: Display work area is smaller than the preferred minimum
- **WHEN** the current Windows display work area is smaller than the preferred Electron minimum size because of resolution, taskbar, or DPI scaling
- **THEN** the configured minimum size is clamped to the available work area so native maximize remains available

#### Scenario: Browser viewport is below the minimum during development
- **WHEN** the app is viewed in a browser viewport below the configured minimum size
- **THEN** the UI remains understandable enough for development diagnostics but is not required to provide full production usability

### Requirement: Stable App Shell Regions
The system SHALL keep the unified top bar, left navigation, main content, and right context panel in stable layout regions without incoherent overlap.

#### Scenario: Standard desktop viewport
- **WHEN** the app is displayed at a standard desktop width
- **THEN** the unified top bar, left navigation, main content, and right context panel are all visible according to the approved layout rules

#### Scenario: Compact desktop viewport
- **WHEN** the app is displayed at a compact desktop width
- **THEN** the right context panel remains an opened third column when enabled, can be closed from its top-bar affordance, and the left navigation becomes icon-only while the main content remains usable

#### Scenario: Right context panel is resized
- **WHEN** the user drags the right panel resize handle
- **THEN** the right context panel width changes within approved bounds without overlapping the main content

#### Scenario: Right context panel content changes by route
- **WHEN** the route is 首页
- **THEN** the right context panel displays local resource overview content when opened
- **WHEN** the route is 项目, 任务, 数据, 模型, or 设置
- **THEN** the right context panel displays the AI assistant when opened

#### Scenario: Narrower constrained viewport
- **WHEN** the app is displayed near the minimum supported width and the icon-only navigation still leaves insufficient workspace
- **THEN** the left navigation can fully collapse behind an explicit reopen control

### Requirement: Main Content Scroll Ownership
The system SHALL ensure complex pages use bounded content regions and predictable internal scrolling instead of relying on uncontrolled body scrolling.

#### Scenario: Page content exceeds available height
- **WHEN** a page contains more vertical content than the available workspace height
- **THEN** the page scrolls inside the intended content region without pushing fixed shell regions off screen

#### Scenario: Nested scrollable content appears
- **WHEN** logs, tables, lists, editors, or detail panes require their own scroll areas
- **THEN** the scroll areas remain discoverable and do not trap users away from primary page actions

### Requirement: Dense Data Layout Resilience
The system SHALL keep tables, lists, logs, forms, and detail views readable and operable across supported desktop sizes.

#### Scenario: Table width exceeds available content width
- **WHEN** a table cannot fit all columns in the available content width
- **THEN** the table uses the most common existing project pattern, or horizontal scrolling if no common pattern exists, without breaking the surrounding layout

#### Scenario: Toolbar controls exceed available width
- **WHEN** toolbar controls cannot fit in one row
- **THEN** controls wrap, collapse, or move into an overflow pattern while preserving labels or tooltips needed for operation

### Requirement: Shared Page Cleanup
The system SHALL apply the shared top bar, right context panel, scroll containment, and duplicate-title cleanup consistently across 首页, 项目, 任务, 数据, 模型, and 设置.

#### Scenario: Current responsive pass is implemented
- **WHEN** page-specific responsive work is performed in this change
- **THEN** 首页 receives local resource overview behavior and 项目, 任务, 数据, 模型, 设置 receive the shared AI assistant right-panel behavior

#### Scenario: Module title appears in the unified top bar
- **WHEN** the current route is 项目, 任务, 数据, 模型, or 设置
- **THEN** the module name appears in the unified top bar and is not repeated as a duplicate content-area heading

### Requirement: Modal and Drawer Constraints
The system SHALL constrain modals, drawers, and confirmation dialogs to the visible workspace.

#### Scenario: Dialog content exceeds viewport height
- **WHEN** a modal or confirmation dialog contains more content than the available viewport height
- **THEN** the dialog keeps its primary actions visible or reachable and scrolls the content area internally

#### Scenario: Dialog width exceeds compact desktop space
- **WHEN** a modal or drawer opens on a compact desktop viewport
- **THEN** it fits within the viewport margins without clipping primary content or actions

### Requirement: Electron Validation
The system SHALL validate responsive layout behavior in Electron on Windows and macOS before the change is considered complete.

#### Scenario: Electron window is resized through supported sizes
- **WHEN** the app is run in Electron on Windows or macOS and resized through the approved size range
- **THEN** shell regions, page content, dialogs, and key controls remain usable without incoherent overlap

#### Scenario: Browser and Electron behavior differ
- **WHEN** a layout issue appears only in Electron
- **THEN** the implementation treats the Electron behavior as release-blocking for desktop delivery

### Requirement: Native Platform Title Bars
The system SHALL use native Electron/system title bars on Windows and macOS for this responsive implementation.

#### Scenario: Windows desktop shell is configured
- **WHEN** the app runs in the Windows Electron shell
- **THEN** it uses native Windows window controls and does not require custom draggable title bar behavior

#### Scenario: Windows maximize control is available
- **WHEN** the app runs in the Windows Electron shell
- **THEN** the native maximize control is enabled and the window remains resizable

#### Scenario: macOS desktop shell is configured
- **WHEN** the app runs in the macOS Electron shell
- **THEN** it uses native macOS window controls and does not require custom draggable title bar behavior
