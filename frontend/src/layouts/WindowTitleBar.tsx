import { Bot, Code2, Grid2X2, History, SquarePen } from "lucide-react";
import { SidebarToggle } from "../components/SidebarToggle";

interface WindowTitleBarProps {
  assistantOpen?: boolean;
  conversationHistoryOpen?: boolean;
  moduleLabel?: string;
  resourceOverviewOpen: boolean;
  showResourceControls?: boolean;
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
  onToggleAssistant,
  onToggleConversationHistory,
  onNewConversation,
  onToggleResourceOverview,
}: WindowTitleBarProps) {
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
            {moduleLabel ? <strong className="titlebar-module-label">{moduleLabel}</strong> : null}
          </>
        ) : (
          <strong className="titlebar-module-label">{moduleLabel}</strong>
        )}
      </div>
      <div className="titlebar-right">
        {showResourceControls ? (
          <>
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
          <button
            className={`titlebar-assistant-button${assistantOpen ? " titlebar-assistant-button--active" : ""}`}
            type="button"
            aria-pressed={assistantOpen}
            onClick={onToggleAssistant}
          >
            <Bot size={14} />
            AI 助手
          </button>
        )}
      </div>
    </header>
  );
}
