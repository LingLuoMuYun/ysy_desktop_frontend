import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Check, Code2, Copy, Grid2X2, History, Minus, Pencil, RefreshCw, Square, SquarePen, X } from "lucide-react";
import { SidebarToggle } from "../components/SidebarToggle";

interface WindowTitleBarProps {
  assistantOpen?: boolean;
  conversationHistoryOpen?: boolean;
  moduleLabel?: string;
  resourceOverviewOpen: boolean;
  showResourceControls?: boolean;
  onRefreshPage: () => void;
  onRenameModule?: (newTitle: string) => void;
  onToggleAssistant?: () => void;
  onToggleConversationHistory?: () => void;
  onNewConversation?: () => void;
  onToggleResourceOverview: () => void;
}

export function WindowTitleBar({
  assistantOpen = false,
  conversationHistoryOpen = false,
  moduleLabel,
  resourceOverviewOpen,
  showResourceControls = true,
  onRefreshPage,
  onRenameModule,
  onToggleAssistant,
  onToggleConversationHistory,
  onNewConversation,
  onToggleResourceOverview,
}: WindowTitleBarProps) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [windowMaximized, setWindowMaximized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const showWindowControls = window.ysyDesktop?.platform === "win32";

  useEffect(() => {
    if (!showWindowControls) return;
    void window.ysyDesktop?.isWindowMaximized?.().then(setWindowMaximized);
    return window.ysyDesktop?.onWindowMaximizeStateChange?.(setWindowMaximized);
  }, [showWindowControls]);

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  const handleStartRename = useCallback(() => {
    setRenaming(true);
    setRenameValue(moduleLabel || "");
    setContextMenu(null);
  }, [moduleLabel]);

  const handleSubmitRename = useCallback(() => {
    if (renameValue.trim() && onRenameModule) {
      onRenameModule(renameValue.trim());
    }
    setRenaming(false);
    setRenameValue("");
  }, [renameValue, onRenameModule]);

  const handleCancelRename = useCallback(() => {
    setRenaming(false);
    setRenameValue("");
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelRename();
      }
    },
    [handleSubmitRename, handleCancelRename],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!onRenameModule) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [onRenameModule]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  /** 刷新按钮点击：启动旋转动画，最短持续 600ms */
  const handleRefreshClick = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onRefreshPage();
    refreshTimerRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, [isRefreshing, onRefreshPage]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const renameInput = renaming ? (
    <div className="titlebar-rename">
      <input
        ref={renameInputRef}
        className="titlebar-rename-input"
        value={renameValue}
        onChange={(e) => setRenameValue(e.target.value)}
        onKeyDown={handleRenameKeyDown}
        onBlur={handleSubmitRename}
        placeholder="输入新名称"
      />
      <button
        className="titlebar-rename-confirm"
        type="button"
        title="确认"
        onMouseDown={(e) => {
          e.preventDefault();
          handleSubmitRename();
        }}
      >
        <Check size={13} />
      </button>
      <button
        className="titlebar-rename-cancel"
        type="button"
        title="取消"
        onMouseDown={(e) => {
          e.preventDefault();
          handleCancelRename();
        }}
      >
        <X size={13} />
      </button>
    </div>
  ) : null;

  const moduleLabelElement = moduleLabel ? (
    renaming ? renameInput : (
      <strong
        className="titlebar-module-label"
        title="双击或右键重命名"
        onDoubleClick={() => { if (onRenameModule) handleStartRename(); }}
        onContextMenu={handleContextMenu}
      >
        {moduleLabel}
      </strong>
    )
  ) : null;

  return (
    <header className="home-toolbar">
      <div className="titlebar-left">
        <SidebarToggle className="titlebar-icon-btn" />
        {showResourceControls ? (
          <>
            <button
              className={`titlebar-icon-btn${conversationHistoryOpen ? " titlebar-icon-btn--active" : ""}`}
              type="button"
              aria-label="对话历史"
              aria-pressed={conversationHistoryOpen}
              onClick={onToggleConversationHistory}
            >
              <History size={16} />
              <span className="titlebar-icon-tip">对话历史</span>
            </button>
            <button
              className="titlebar-icon-btn"
              type="button"
              aria-label="新对话"
              onClick={onNewConversation}
            >
              <SquarePen size={16} />
              <span className="titlebar-icon-tip">新对话</span>
            </button>
            {moduleLabelElement}
          </>
        ) : (
          moduleLabelElement
        )}
      </div>
      <div className="titlebar-right">
        {showResourceControls ? (
          <>
            <button
              className={`icon-button titlebar-refresh-button${isRefreshing ? " titlebar-refresh-button--spinning" : ""}`}
              type="button"
              title="刷新页面状态"
              aria-label="刷新页面状态"
              disabled={isRefreshing}
              onClick={handleRefreshClick}
            >
              <RefreshCw size={15} className={isRefreshing ? "icon-spin" : ""} />
            </button>
            <button className="launcher-button" type="button">
              <Code2 size={14} />
              打开位置
            </button>
            <button
              className={`icon-button${resourceOverviewOpen ? " icon-button--active" : ""}`}
              type="button"
              title="本机资源概览"
              aria-label="本机资源概览"
              aria-pressed={resourceOverviewOpen}
              onClick={onToggleResourceOverview}
            >
              <Grid2X2 size={15} />
            </button>
          </>
        ) : (
          <>
            <button
              className={`icon-button titlebar-refresh-button${isRefreshing ? " titlebar-refresh-button--spinning" : ""}`}
              type="button"
              title="刷新页面状态"
              aria-label="刷新页面状态"
              disabled={isRefreshing}
              onClick={handleRefreshClick}
            >
              <RefreshCw size={15} className={isRefreshing ? "icon-spin" : ""} />
            </button>
            <button
              className={`titlebar-assistant-button${assistantOpen ? " titlebar-assistant-button--active" : ""}`}
              type="button"
              aria-pressed={assistantOpen}
              onClick={onToggleAssistant}
            >
              <Bot size={14} />
              AI 助手
            </button>
          </>
        )}
        {showWindowControls ? (
          <div className="window-control-group" aria-label="窗口控制">
            <button
              className="window-control-button"
              type="button"
              title="最小化"
              aria-label="最小化窗口"
              onClick={() => void window.ysyDesktop?.minimizeWindow?.()}
            >
              <Minus size={16} strokeWidth={1.8} />
            </button>
            <button
              className="window-control-button"
              type="button"
              title={windowMaximized ? "还原" : "最大化"}
              aria-label={windowMaximized ? "还原窗口" : "最大化窗口"}
              onClick={() => void window.ysyDesktop?.toggleMaximizeWindow?.()}
            >
              {windowMaximized ? <Copy size={13} strokeWidth={1.7} /> : <Square size={12} strokeWidth={1.8} />}
            </button>
            <button
              className="window-control-button window-control-button--close"
              type="button"
              title="关闭"
              aria-label="关闭窗口"
              onClick={() => void window.ysyDesktop?.closeWindow?.()}
            >
              <X size={17} strokeWidth={1.7} />
            </button>
          </div>
        ) : null}
      </div>

      {/* 右键菜单 */}
      {contextMenu &&
        createPortal(
          <div
            className="context-menu-backdrop"
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCloseContextMenu();
            }}
          >
            <div
              className="context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              role="menu"
            >
              <button
                className="context-menu__item"
                type="button"
                role="menuitem"
                onClick={handleStartRename}
              >
                <Pencil size={13} />
                重命名
              </button>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
