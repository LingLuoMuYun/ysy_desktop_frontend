import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, useCallback, useEffect, useState } from "react";
import type { RouteKey } from "../app/router";
import { AssistantPanel } from "./AssistantPanel";
import { AssistantPanelProvider } from "./AssistantPanelContext";
import { ConversationHistoryPanel } from "./ConversationHistoryPanel";
import type { ConversationSummary } from "./conversationTypes";
import { LocalResourcePopover } from "./LocalResourcePopover";
import { Sidebar } from "./Sidebar";
import { WindowTitleBar } from "./WindowTitleBar";

interface AppShellProps {
  activeRoute: RouteKey;
  children: ReactNode;
  onRouteChange: (routeKey: RouteKey) => void;
}

const DEFAULT_RIGHT_PANEL_WIDTH = 354;
const MIN_RIGHT_PANEL_WIDTH = 320;
const MAX_RIGHT_PANEL_WIDTH = 460;
// 当前首页历史先使用前端内存态，后续接 /api/sessions 时保留同一会话模型入口。
const createConversationId = () => `home-conversation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function getCurrentTimeLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function createEmptyConversation(): ConversationSummary {
  return {
    id: createConversationId(),
    title: "新的对话",
    updatedAt: getCurrentTimeLabel(),
    messages: [],
  };
}

const ROUTE_LABELS: Record<RouteKey, string> = {
  home: "首页",
  projects: "项目",
  tasks: "任务",
  data: "数据",
  models: "模型",
  settings: "设置",
};

export function AppShell({ activeRoute, children, onRouteChange }: AppShellProps) {
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resourceOverviewOpen, setResourceOverviewOpen] = useState(false);
  const [conversationHistoryOpen, setConversationHistoryOpen] = useState(false);
  // 首页对话历史由 AppShell 托管，确保顶部栏、历史栏和 HomePage 消息区共享同一当前会话。
  const [homeConversations, setHomeConversations] = useState<ConversationSummary[]>(() => [createEmptyConversation()]);
  const [activeHomeConversationId, setActiveHomeConversationId] = useState(() => "");
  const [homeConversationTitle, setHomeConversationTitle] = useState("");
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH);
  const isHome = activeRoute === "home";
  const activeHomeConversation = homeConversations.find((conversation) => conversation.id === activeHomeConversationId)
    ?? homeConversations[0]
    ?? createEmptyConversation();
  const moduleLabel = isHome ? homeConversationTitle || ROUTE_LABELS.home : ROUTE_LABELS[activeRoute];
  const showAssistant = activeRoute !== "home" && assistantOpen;
  const showRightPanel = isHome ? resourceOverviewOpen : showAssistant;
  const showGridAssistant = showAssistant;
  const shellStyle = {
    "--assistant-width": `${rightPanelWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    if (!isHome) {
      setResourceOverviewOpen(false);
      setConversationHistoryOpen(false);
      setHomeConversationTitle("");
    }
  }, [isHome]);

  // 初始化当前会话 id，避免首屏空会话尚未写入消息时 HomePage 拿不到会话容器。
  useEffect(() => {
    if (!activeHomeConversationId && homeConversations[0]) {
      setActiveHomeConversationId(homeConversations[0].id);
    }
  }, [activeHomeConversationId, homeConversations]);

  // 顶部栏标题跟随当前历史会话；空白新对话仍显示“首页”。
  useEffect(() => {
    setHomeConversationTitle(activeHomeConversation.messages.length > 0 ? activeHomeConversation.title : "");
  }, [activeHomeConversation.messages.length, activeHomeConversation.title]);

  const handleRightPanelResize = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const startX = event.clientX;
    const startWidth = rightPanelWidth;
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);

    function handlePointerMove(moveEvent: PointerEvent) {
      const nextWidth = startWidth - (moveEvent.clientX - startX);
      setRightPanelWidth(Math.min(MAX_RIGHT_PANEL_WIDTH, Math.max(MIN_RIGHT_PANEL_WIDTH, nextWidth)));
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }, [rightPanelWidth]);

  const handleHomeMessagesChange = useCallback((messages: ConversationSummary["messages"], title: string) => {
    setHomeConversations((current) => {
      const existingConversation = current.find((conversation) => conversation.id === activeHomeConversation.id);
      const nextConversation: ConversationSummary = {
        id: existingConversation?.id ?? activeHomeConversation.id,
        title: title || existingConversation?.title || "新的对话",
        updatedAt: getCurrentTimeLabel(),
        messages,
      };
      const rest = current.filter((conversation) => conversation.id !== nextConversation.id);
      // 最近更新的会话置顶，历史栏只展示已产生消息的会话。
      return [nextConversation, ...rest];
    });
    setActiveHomeConversationId(activeHomeConversation.id);
  }, [activeHomeConversation.id]);

  const handleNewConversation = useCallback(() => {
    const nextConversation = createEmptyConversation();
    setHomeConversations((current) => [nextConversation, ...current]);
    setActiveHomeConversationId(nextConversation.id);
    setHomeConversationTitle("");
  }, []);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setActiveHomeConversationId(conversationId);
  }, []);

  return (
    <div className="desktop-stage">
      <div
        className={`app-window app-window--${activeRoute}${
          showRightPanel ? "" : " app-window--assistant-closed"
        }${sidebarCollapsed ? " app-window--menu-collapsed" : ""}${
          isHome && conversationHistoryOpen ? " app-window--history-open" : ""
        }`}
        style={shellStyle}
      >
        <Sidebar
          activeRoute={activeRoute}
          onRouteChange={onRouteChange}
        />
        <AssistantPanelProvider
          assistantOpen={showAssistant}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
          toggleAssistant={() => setAssistantOpen((isOpen) => !isOpen)}
        >
          <WindowTitleBar
            assistantOpen={assistantOpen}
            conversationHistoryOpen={conversationHistoryOpen}
            moduleLabel={moduleLabel}
            resourceOverviewOpen={resourceOverviewOpen}
            showResourceControls={isHome}
            onToggleAssistant={() => setAssistantOpen((isOpen) => !isOpen)}
            onToggleConversationHistory={() => setConversationHistoryOpen((isOpen) => !isOpen)}
            onNewConversation={handleNewConversation}
            onToggleResourceOverview={() => setResourceOverviewOpen((isOpen) => !isOpen)}
          />
          {isHome ? (
            <ConversationHistoryPanel
              activeConversationId={activeHomeConversation.id}
              conversations={homeConversations.filter((conversation) => conversation.messages.length > 0)}
              open={conversationHistoryOpen}
              onSelectConversation={handleSelectConversation}
            />
          ) : null}
          <div className="app-surface">
            <main className={`workspace workspace--${activeRoute}`}>
              {isHome && isValidElement(children)
                ? cloneElement(children as ReactElement<{
                    messages?: ConversationSummary["messages"];
                    onConversationTitleChange?: (title: string) => void;
                    onMessagesChange?: (messages: ConversationSummary["messages"], title: string) => void;
                  }>, {
                    messages: activeHomeConversation.messages,
                    onConversationTitleChange: setHomeConversationTitle,
                    onMessagesChange: handleHomeMessagesChange,
                  })
                : children}
            </main>
          </div>
          {showRightPanel ? (
            <button
              className="right-panel-resizer"
              type="button"
              aria-label="调整右侧栏宽度"
              onPointerDown={handleRightPanelResize}
            />
          ) : null}
          {isHome ? (
            <LocalResourcePopover open={resourceOverviewOpen} />
          ) : null}
          {showGridAssistant ? <AssistantPanel activeRoute={activeRoute} /> : null}
        </AssistantPanelProvider>
      </div>
    </div>
  );
}
