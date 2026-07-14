import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { RouteKey } from "../app/router";
import { chatApi, type SessionDetail, type SessionSummary } from "../services/chatApi";
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
const AUTO_COLLAPSE_WIDTH = 960;

const createConversationId = () => `home-conversation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function getCurrentTimeLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function formatSessionTime(value?: string) {
  if (!value) return "";
  const normalizedValue = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ? value.replace(" ", "T")
    : value;
  const valueWithTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalizedValue)
    ? `${normalizedValue}Z`
    : normalizedValue;
  const date = new Date(valueWithTimezone);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getSessionIdentity(conversation: Pick<ConversationSummary, "id" | "sessionKey">) {
  return conversation.sessionKey || `runtime:${conversation.id}`;
}

/** 将 updatedAt 转为可比较的排序键（降序靠前 = 值更大）。 */
function getSortKey(updatedAt: string): string {
  // "MM/DD HH:MM" → "MMDDHHMM"
  const dateTimeMatch = updatedAt.match(/^(\d{2})\/(\d{2})\s(\d{2}):(\d{2})$/);
  if (dateTimeMatch) return dateTimeMatch.slice(1).join("");
  // "HH:MM" → 当天用 "9999HHMM" 排在 server 格式之前
  const timeMatch = updatedAt.match(/^(\d{2}):(\d{2})$/);
  if (timeMatch) return `9999${timeMatch[1]}${timeMatch[2]}`;
  // fallback: 返回原字符串
  return updatedAt;
}

function sortByUpdatedAtDesc(conversations: ConversationSummary[]): ConversationSummary[] {
  return [...conversations].sort((a, b) => getSortKey(b.updatedAt).localeCompare(getSortKey(a.updatedAt)));
}

function createEmptyConversation(): ConversationSummary {
  return {
    id: createConversationId(),
    title: "新的对话",
    updatedAt: getCurrentTimeLabel(),
    messages: [],
    source: "local",
  };
}

function getTitleFromMessages(messages: ConversationSummary["messages"], fallback: string) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.text.trim());
  return firstUserMessage?.text.slice(0, 18) || fallback;
}

function mapSessionSummary(session: SessionSummary): ConversationSummary {
  return {
    id: session.conversation_id,
    sessionKey: session.session_key,
    title: session.title || session.preview || session.conversation_id || session.key,
    updatedAt: session.updated_at_text || formatSessionTime(session.updated_at || session.created_at) || getCurrentTimeLabel(),
    messages: [],
    source: "server",
  };
}

interface MapSessionDetailOptions {
  refreshLatestAssistantTime?: boolean;
  updatedAt?: string;
}

function mapSessionDetail(
  detail: SessionDetail,
  fallback: ConversationSummary,
  options: MapSessionDetailOptions = {},
): ConversationSummary {
  const messages: ConversationSummary["messages"] = [];
  const visibleSessionMessages = detail.messages.filter((message) => message.role === "user" || message.role === "assistant");
  const nextUpdatedAt = options.updatedAt || fallback.updatedAt;

  for (let index = 0; index < visibleSessionMessages.length; index += 1) {
    const message = visibleSessionMessages[index];
    if (message.role === "user") {
      const previousMessage = fallback.messages[messages.length];
      const messageTime = formatSessionTime(message.timestamp);
      messages.push({
        id: `${fallback.sessionKey || fallback.id}-${index}`,
        role: "user",
        text: message.content,
        time: messageTime || (previousMessage?.role === "user" && previousMessage.text === message.content
          ? previousMessage.time
          : nextUpdatedAt),
      });
      continue;
    }

    const candidateGroup = [message];
    while (
      index + 1 < visibleSessionMessages.length &&
      visibleSessionMessages[index + 1].role === "assistant" &&
      Boolean(visibleSessionMessages[index + 1].candidate_id || message.candidate_id)
    ) {
      candidateGroup.push(visibleSessionMessages[index + 1]);
      index += 1;
    }

    const previousMessage = fallback.messages[messages.length];
    const candidates = candidateGroup
      .map((candidate, candidateIndex) => {
        const candidateId = candidate.candidate_id || `${fallback.sessionKey || fallback.id}-candidate-${index}-${candidateIndex}`;
        const previousCandidate = previousMessage?.role === "assistant"
          ? previousMessage.candidates?.find((item) => item.id === candidateId)
            ?? previousMessage.candidates?.find((item) => item.text === candidate.content)
          : undefined;
        const candidateTime = formatSessionTime(candidate.timestamp);
        return {
          id: candidateId,
          text: candidate.content,
          index: candidate.candidate_index ?? candidateIndex + 1,
          active: candidate.candidate_active ?? candidateIndex === candidateGroup.length - 1,
          time: candidateTime || previousCandidate?.time || nextUpdatedAt,
        };
      })
      .sort((a, b) => a.index - b.index);
    const activeCandidate = candidates.find((candidate) => candidate.active) ?? candidates[candidates.length - 1];
    const activeText = activeCandidate?.text ?? message.content;

    messages.push({
      id: `${fallback.sessionKey || fallback.id}-${index}`,
      role: "assistant",
      text: activeText,
      time: activeCandidate?.time || (previousMessage?.role === "assistant" && previousMessage.text === activeText
        ? previousMessage.time
        : nextUpdatedAt),
      candidateId: activeCandidate?.id,
      candidateActive: activeCandidate?.active,
      candidateIndex: activeCandidate?.index,
      candidates: candidates.length > 1 ? candidates : undefined,
    });
  }

  if (options.refreshLatestAssistantTime) {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "assistant") {
        const refreshedCandidates = messages[index].candidates?.map((candidate) =>
          candidate.active && !candidate.time ? { ...candidate, time: nextUpdatedAt } : candidate,
        );
        const activeCandidate = refreshedCandidates?.find((candidate) => candidate.active);
        messages[index] = {
          ...messages[index],
          time: activeCandidate?.time || nextUpdatedAt,
          candidates: refreshedCandidates,
        };
        break;
      }
    }
  }

  return {
    ...fallback,
    title: getTitleFromMessages(messages, fallback.title),
    updatedAt: nextUpdatedAt,
    messages,
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
  const [autoCompactShell, setAutoCompactShell] = useState(() => (
    typeof window === "undefined" ? false : window.innerWidth <= AUTO_COLLAPSE_WIDTH
  ));
  const [resourceOverviewOpen, setResourceOverviewOpen] = useState(false);
  const [conversationHistoryOpen, setConversationHistoryOpen] = useState(false);
  const [homeConversations, setHomeConversations] = useState<ConversationSummary[]>(() => [createEmptyConversation()]);
  const [activeHomeConversationId, setActiveHomeConversationId] = useState(() => "");
  const [homeConversationTitle, setHomeConversationTitle] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<ConversationSummary | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH);
  const [pageRefreshNonce, setPageRefreshNonce] = useState(0);
  const isHome = activeRoute === "home";
  const effectiveSidebarCollapsed = sidebarCollapsed || autoCompactShell;
  const activeHomeConversation = homeConversations.find((conversation) => conversation.id === activeHomeConversationId)
    ?? homeConversations[0]
    ?? createEmptyConversation();
  const visibleConversations = homeConversations.filter((conversation) => conversation.messages.length > 0 || conversation.source === "server");
  const moduleLabel = isHome ? homeConversationTitle || ROUTE_LABELS.home : ROUTE_LABELS[activeRoute];
  const showAssistant = activeRoute !== "home" && assistantOpen && !autoCompactShell;
  const showRightPanel = !autoCompactShell && (isHome ? resourceOverviewOpen : showAssistant);
  const showGridAssistant = showAssistant;
  const shellStyle = {
    "--assistant-width": `${rightPanelWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    const handleResize = () => {
      setAutoCompactShell(window.innerWidth <= AUTO_COLLAPSE_WIDTH);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setResourceOverviewOpen(false);
      setConversationHistoryOpen(false);
      setHomeConversationTitle("");
    }
  }, [isHome]);

  useEffect(() => {
    if (!activeHomeConversationId && homeConversations[0]) {
      setActiveHomeConversationId(homeConversations[0].id);
    }
  }, [activeHomeConversationId, homeConversations]);

  useEffect(() => {
    setHomeConversationTitle(activeHomeConversation.messages.length > 0 ? activeHomeConversation.title : "");
  }, [activeHomeConversation.messages.length, activeHomeConversation.title]);

  const loadSessionList = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const sessions = await chatApi.listSessions();
      const serverConversations = sessions.map(mapSessionSummary);

      setHomeConversations((current) => {
        const serverIds = new Set(serverConversations.map((conversation) => conversation.id));
        const serverSessionKeys = new Set(serverConversations.map((conversation) => conversation.sessionKey).filter(Boolean));
        const localConversations = current.filter((conversation) => {
          if (conversation.source === "server") return false;
          if (serverIds.has(conversation.id)) return false;
          if (serverSessionKeys.has(conversation.sessionKey)) return false;
          if (serverSessionKeys.has(getSessionIdentity(conversation))) return false;
          return true;
        });
        const currentById = new Map(current.map((conversation) => [conversation.id, conversation]));
        const currentBySession = new Map(
          current
            .map((conversation) => [getSessionIdentity(conversation), conversation] as const),
        );
        const mergedServerConversations = serverConversations.map((conversation) => {
          const existingConversation = currentById.get(conversation.id)
            ?? currentBySession.get(getSessionIdentity(conversation));
          return existingConversation?.messages.length
            ? {
                ...conversation,
                messages: existingConversation.messages,
                title: existingConversation.title || conversation.title,
              }
            : conversation;
        });
        const nextConversations = [
          ...localConversations.filter((conversation) => conversation.messages.length === 0),
          ...sortByUpdatedAtDesc(mergedServerConversations),
          ...sortByUpdatedAtDesc(localConversations.filter((conversation) => conversation.messages.length > 0)),
        ];
        return nextConversations.length > 0 ? nextConversations : [createEmptyConversation()];
      });
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "历史会话加载失败");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessionList();
  }, [loadSessionList]);

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
        sessionKey: existingConversation?.sessionKey,
        title: title || existingConversation?.title || "新的对话",
        updatedAt: getCurrentTimeLabel(),
        messages,
        source: existingConversation?.source ?? "local",
      };
      const rest = current.filter((conversation) => conversation.id !== nextConversation.id);
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

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    const target = homeConversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;
    setActiveHomeConversationId(conversationId);
    if (!target.sessionKey || target.messages.length > 0) return;

    setHistoryLoading(true);
    setHistoryError("");
    try {
      const detail = await chatApi.getSession(target.sessionKey);
      setHomeConversations((current) => current.map((conversation) =>
        conversation.id === conversationId ? mapSessionDetail(detail, conversation) : conversation,
      ));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "会话详情加载失败");
    } finally {
      setHistoryLoading(false);
    }
  }, [homeConversations]);

  const handleProviderSelectConversation = useCallback((conversationId: string) => {
    void handleSelectConversation(conversationId);
  }, [handleSelectConversation]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    const target = homeConversations.find((conversation) => conversation.id === conversationId);
    if (!target) return;
    setDeleteConfirmTarget(target);
  }, [homeConversations]);

  const refreshConversationDetail = useCallback(async (
    conversation: ConversationSummary,
    options: MapSessionDetailOptions = {},
  ) => {
    const sessionKey = conversation.sessionKey || `runtime:${conversation.id}`;
    const detail = await chatApi.getSession(sessionKey);
    setHomeConversations((current) => {
      const refreshed = mapSessionDetail(detail, { ...conversation, sessionKey }, options);
      const rest = current.filter((item) => item.id !== conversation.id);
      return [refreshed, ...rest];
    });
  }, []);

  const handleEditLatestUserMessage = useCallback(async (message: string) => {
    const target = activeHomeConversation;
    const result = await chatApi.editLatestMessage(target.id, message);
    await refreshConversationDetail({
      ...target,
      sessionKey: result.sessionKey || target.sessionKey || `runtime:${target.id}`,
    });
  }, [activeHomeConversation, refreshConversationDetail]);

  const handleRegenerateLatestAnswer = useCallback(async () => {
    const target = activeHomeConversation;
    const result = await chatApi.regenerateLatestMessage(target.id);
    const regeneratedAt = getCurrentTimeLabel();
    await refreshConversationDetail({
      ...target,
      updatedAt: regeneratedAt,
      sessionKey: result.sessionKey || target.sessionKey || `runtime:${target.id}`,
    }, { refreshLatestAssistantTime: true, updatedAt: regeneratedAt });
  }, [activeHomeConversation, refreshConversationDetail]);

  const handleSwitchLatestCandidate = useCallback(async (candidateId: string) => {
    const target = activeHomeConversation;
    const detail = await chatApi.switchLatestCandidate(target.id, candidateId);
    setHomeConversations((current) => {
      const updated = mapSessionDetail(detail, target);
      const rest = current.filter((item) => item.id !== target.id);
      return [updated, ...rest];
    });
  }, [activeHomeConversation]);

  const handleCancelDeleteConversation = useCallback(() => {
    if (deleteSubmitting) return;
    setDeleteConfirmTarget(null);
  }, [deleteSubmitting]);

  const handleConfirmDeleteConversation = useCallback(async () => {
    if (!deleteConfirmTarget || deleteSubmitting) return;
    setHistoryError("");
    setDeleteSubmitting(true);
    try {
      if (deleteConfirmTarget.sessionKey) {
        await chatApi.deleteSession(deleteConfirmTarget.sessionKey);
      }
      setHomeConversations((current) => {
        const remaining = current.filter((conversation) => conversation.id !== deleteConfirmTarget.id);
        const nextConversations = remaining.length > 0 ? remaining : [createEmptyConversation()];
        if (activeHomeConversationId === deleteConfirmTarget.id) {
          setActiveHomeConversationId(nextConversations[0].id);
        }
        return nextConversations;
      });
      setDeleteConfirmTarget(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "删除会话失败");
    } finally {
      setDeleteSubmitting(false);
    }
  }, [activeHomeConversationId, deleteConfirmTarget, deleteSubmitting]);

  const handleToggleConversationHistory = useCallback(() => {
    const nextOpen = !conversationHistoryOpen;
    setConversationHistoryOpen(nextOpen);
    if (nextOpen) {
      void loadSessionList();
    }
  }, [conversationHistoryOpen, loadSessionList]);

  const handleRefreshPage = useCallback(() => {
    setPageRefreshNonce((nonce) => nonce + 1);
    if (isHome && conversationHistoryOpen) {
      void loadSessionList();
    }
  }, [conversationHistoryOpen, isHome, loadSessionList]);

  return (
    <div className="desktop-stage">
      <div
        className={`app-window app-window--${activeRoute}${
          showRightPanel ? "" : " app-window--assistant-closed"
        }${effectiveSidebarCollapsed ? " app-window--menu-collapsed" : ""}${
          autoCompactShell ? " app-window--shell-compact" : ""
        }${isHome && conversationHistoryOpen && !autoCompactShell ? " app-window--history-open" : ""
        }`}
        style={shellStyle}
      >
        <Sidebar
          activeRoute={activeRoute}
          onRouteChange={onRouteChange}
        />
        <AssistantPanelProvider
          assistantOpen={showAssistant}
          sidebarCollapsed={effectiveSidebarCollapsed}
          messages={activeHomeConversation.messages}
          conversations={visibleConversations}
          activeConversationId={activeHomeConversation.id}
          activeConversationTitle={activeHomeConversation.title}
          toggleSidebar={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
          toggleAssistant={() => setAssistantOpen((isOpen) => !isOpen)}
          onMessagesChange={handleHomeMessagesChange}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleProviderSelectConversation}
          onEditLatestUserMessage={handleEditLatestUserMessage}
          onRegenerateLatestAnswer={handleRegenerateLatestAnswer}
          onSwitchLatestCandidate={handleSwitchLatestCandidate}
        >
          <WindowTitleBar
            assistantOpen={assistantOpen}
            conversationHistoryOpen={conversationHistoryOpen}
            moduleLabel={moduleLabel}
            resourceOverviewOpen={resourceOverviewOpen}
            showResourceControls={isHome}
            onRefreshPage={handleRefreshPage}
            onToggleAssistant={() => setAssistantOpen((isOpen) => !isOpen)}
            onToggleConversationHistory={handleToggleConversationHistory}
            onNewConversation={handleNewConversation}
            onToggleResourceOverview={() => setResourceOverviewOpen((isOpen) => !isOpen)}
          />
          {isHome && !autoCompactShell ? (
            <ConversationHistoryPanel
              activeConversationId={activeHomeConversation.id}
              conversations={visibleConversations}
              error={historyError}
              loading={historyLoading}
              open={conversationHistoryOpen}
              onDeleteConversation={handleDeleteConversation}
              onSelectConversation={(conversationId) => void handleSelectConversation(conversationId)}
            />
          ) : null}
          <div className="app-surface">
            <main className={`workspace workspace--${activeRoute}`} key={`${activeRoute}-${pageRefreshNonce}`}>
              {isHome && isValidElement(children)
                ? cloneElement(children as ReactElement<{
                    conversationId?: string;
                    messages?: ConversationSummary["messages"];
                    onConversationTitleChange?: (title: string) => void;
                    onEditLatestUserMessage?: (message: string) => Promise<void>;
                    onMessagesChange?: (messages: ConversationSummary["messages"], title: string) => void;
                    onRegenerateLatestAnswer?: () => Promise<void>;
                    onSwitchLatestCandidate?: (candidateId: string) => Promise<void>;
                  }>, {
                    conversationId: activeHomeConversation.id,
                    messages: activeHomeConversation.messages,
                    onConversationTitleChange: setHomeConversationTitle,
                    onEditLatestUserMessage: handleEditLatestUserMessage,
                    onMessagesChange: handleHomeMessagesChange,
                    onRegenerateLatestAnswer: handleRegenerateLatestAnswer,
                    onSwitchLatestCandidate: handleSwitchLatestCandidate,
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
          {isHome && !autoCompactShell ? (
            <LocalResourcePopover open={resourceOverviewOpen} />
          ) : null}
          {showGridAssistant ? <AssistantPanel activeRoute={activeRoute} /> : null}
          {deleteConfirmTarget ? (
            <div
              className="confirm-overlay conversation-delete-confirm"
              role="presentation"
              onClick={handleCancelDeleteConversation}
            >
              <div
                aria-labelledby="conversation-delete-title"
                aria-modal="true"
                className="confirm-dialog confirm-dialog--environment conversation-delete-confirm__dialog"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
              >
                <div className="confirm-dialog__header confirm-dialog__header--plain">
                  <h2 id="conversation-delete-title">确认删除对话</h2>
                  <button
                    className="confirm-dialog__close"
                    disabled={deleteSubmitting}
                    onClick={handleCancelDeleteConversation}
                    title="关闭"
                    type="button"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="confirm-dialog__content conversation-delete-confirm__content">
                  <p className="confirm-dialog__desc">
                    删除后将移除该 workspace session 文件，历史对话列表中不再显示该记录。
                  </p>
                </div>
                <div className="confirm-dialog__actions confirm-dialog__actions--footer">
                  <button
                    className="settings-action-button"
                    disabled={deleteSubmitting}
                    onClick={handleCancelDeleteConversation}
                    type="button"
                  >
                    取消
                  </button>
                  <button
                    className="settings-action-button settings-action-button--danger"
                    disabled={deleteSubmitting}
                    onClick={handleConfirmDeleteConversation}
                    type="button"
                  >
                    {deleteSubmitting ? "删除中..." : "确认删除"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </AssistantPanelProvider>
      </div>
    </div>
  );
}
