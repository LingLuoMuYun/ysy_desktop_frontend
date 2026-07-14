import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ChatAttachment } from "../components/ChatAttachments";
import { assistantModelsApi } from "../services/assistantModelsApi";
import { chatApi } from "../services/chatApi";
import type { AssistantModelDetail } from "../types/domain";
import type { ConversationSummary } from "./conversationTypes";

// --- 对话共享状态类型 ---
export type AssistMode = "readonly" | "assist" | "confirm";

export type PanelMessage = ConversationSummary["messages"][number];

function getTimeLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

// --- 面板 UI 状态 ---
interface AssistantPanelContextValue {
  assistantOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleAssistant: () => void;
  /** 共享消息列表（跨页面保持） */
  messages: PanelMessage[];
  conversations: ConversationSummary[];
  activeConversationId: string;
  activeConversationTitle: string;
  selectConversation: (conversationId: string) => void;
  /** 从任意页面向助手面板发送消息（异步，等待 AI 回复） */
  sendMessage: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  editLatestUserMessage: (message: string) => Promise<void>;
  regenerateLatestAnswer: () => Promise<void>;
  switchLatestCandidate: (candidateId: string) => Promise<void>;
  /** 新建空白会话 */
  createConversation: () => void;
  /** 当前是否正在等待 AI 回复 */
  isStreaming: boolean;
  /** 模型列表 */
  modelList: AssistantModelDetail[];
  /** 当前使用的模型 */
  currentModel: AssistantModelDetail | null;
  /** 切换运行时模型 */
  switchModel: (modelConfigId: string) => Promise<void>;
  refreshModels: (preferredModelId?: string) => Promise<void>;
  /** 工具栏辅助模式 */
  assistMode: AssistMode;
  setAssistMode: (mode: AssistMode) => void;
  /** 工具栏关联项目 */
  selectedProject: string;
  setSelectedProject: (projectKey: string) => void;
}

const AssistantPanelContext = createContext<AssistantPanelContextValue>({
  assistantOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => undefined,
  toggleAssistant: () => undefined,
  messages: [],
  conversations: [],
  activeConversationId: "",
  activeConversationTitle: "",
  selectConversation: () => undefined,
  sendMessage: async () => undefined,
  editLatestUserMessage: async () => undefined,
  regenerateLatestAnswer: async () => undefined,
  switchLatestCandidate: async () => undefined,
  createConversation: () => undefined,
  isStreaming: false,
  modelList: [],
  currentModel: null,
  switchModel: async () => undefined,
  refreshModels: async () => undefined,
  assistMode: "assist",
  setAssistMode: () => undefined,
  selectedProject: "none",
  setSelectedProject: () => undefined,
});

export function AssistantPanelProvider({
  children,
  assistantOpen,
  sidebarCollapsed,
  toggleSidebar,
  toggleAssistant,
  messages,
  conversations,
  activeConversationId,
  activeConversationTitle,
  onMessagesChange,
  onNewConversation,
  onSelectConversation,
  onEditLatestUserMessage,
  onRegenerateLatestAnswer,
  onSwitchLatestCandidate,
}: {
  children: ReactNode;
  assistantOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleAssistant: () => void;
  messages: ConversationSummary["messages"];
  conversations: ConversationSummary[];
  activeConversationId: string;
  activeConversationTitle: string;
  onMessagesChange: (messages: ConversationSummary["messages"], title: string) => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
  onEditLatestUserMessage: (message: string) => Promise<void>;
  onRegenerateLatestAnswer: () => Promise<void>;
  onSwitchLatestCandidate: (candidateId: string) => Promise<void>;
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelList, setModelList] = useState<AssistantModelDetail[]>([]);
  const [currentModel, setCurrentModel] = useState<AssistantModelDetail | null>(null);
  const [assistMode, setAssistMode] = useState<AssistMode>("assist");
  const [selectedProject, setSelectedProject] = useState("none");
  const defaultModelIdRef = useRef<string | null>(null);

  const loadModels = useCallback(async (preferredModelId?: string) => {
    const models = await assistantModelsApi.list();
    const defaultModel = models.find((model) => model.isDefault) ?? models[0] ?? null;
    const previousDefaultModelId = defaultModelIdRef.current;
    const nextDefaultModelId = defaultModel?.id ?? null;
    const defaultModelChanged = Boolean(previousDefaultModelId && nextDefaultModelId && previousDefaultModelId !== nextDefaultModelId);
    defaultModelIdRef.current = nextDefaultModelId;

    setModelList(models);
    setCurrentModel((current) => {
      if (preferredModelId) {
        return models.find((model) => model.id === preferredModelId) ?? defaultModel;
      }
      if (defaultModelChanged) {
        return defaultModel;
      }
      if (current) {
        const refreshedCurrent = models.find((model) => model.id === current.id);
        if (refreshedCurrent) return refreshedCurrent;
      }
      return defaultModel;
    });
  }, []);

  // 应用启动时加载模型列表，初始选中默认模型
  useEffect(() => {
    let cancelled = false;

    async function loadInitialModels() {
      try {
        const models = await assistantModelsApi.list();
        if (cancelled) return;
        setModelList(models);
        const defaultModel = models.find((m) => m.isDefault) ?? models[0] ?? null;
        defaultModelIdRef.current = defaultModel?.id ?? null;
        setCurrentModel(defaultModel);
      } catch {
        // 加载失败时静默处理，UI 会显示加载状态
      }
    }

    loadInitialModels();
    return () => { cancelled = true; };
  }, []);

  const sendMessage = useCallback(async (text: string, attachments: ChatAttachment[] = []) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const time = getTimeLabel();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const userMsg: PanelMessage = {
      id: `user-${id}`,
      role: "user",
      text: trimmed,
      time,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMsg: PanelMessage = { id: `assistant-${id}`, role: "assistant", text: "", time };
    const initialMessages = [...messages, userMsg, assistantMsg];
    const nextTitle = messages.length > 0
      ? activeConversationTitle || trimmed.slice(0, 18)
      : trimmed.slice(0, 18);

    onMessagesChange(initialMessages, nextTitle);
    setIsStreaming(true);

    try {
      const historyText = messages.slice(-6).map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.text}`).join("\n");
      const fullMessage = messages.length > 0
        ? `[对话历史]\n${historyText}\n\n[当前消息]\n${trimmed}`
        : trimmed;
      let replyText = "";

      const result = await chatApi.sendMessage(
        fullMessage,
        activeConversationId || "default",
        (delta) => {
          replyText += delta;
          onMessagesChange(
            initialMessages.map((message) =>
              message.id === `assistant-${id}` ? { ...message, text: replyText } : message,
            ),
            nextTitle,
          );
        },
        undefined,
        { modelConfigId: currentModel?.id },
      );

      const finalReply = result.reply || replyText;
      onMessagesChange(
        initialMessages.map((message) =>
          message.id === `assistant-${id}` ? { ...message, text: finalReply, time: getTimeLabel() } : message,
        ),
        nextTitle,
      );
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "AI 回复失败";
      onMessagesChange(
        initialMessages.map((message) =>
          message.id === `assistant-${id}` ? { ...message, text: errorText, time: getTimeLabel() } : message,
        ),
        nextTitle,
      );
    } finally {
      setIsStreaming(false);
    }
  }, [activeConversationId, activeConversationTitle, currentModel?.id, isStreaming, messages, onMessagesChange]);

  const switchModel = useCallback(async (modelConfigId: string) => {
    // 这里只切换前端当前对话使用模型，不调用设置默认接口，也不落库修改默认模型。
    const previousModel = currentModel;
    const nextModel = modelList.find((model) => model.id === modelConfigId) ?? null;
    if (previousModel?.id === modelConfigId) return;

    setCurrentModel(nextModel ?? previousModel);
    try {
      await chatApi.switchRuntimeModel(modelConfigId);
      await loadModels(modelConfigId);
    } catch (error) {
      setCurrentModel(previousModel);
      throw error;
    }
  }, [currentModel, loadModels, modelList]);

  const refreshModels = useCallback(async (preferredModelId?: string) => {
    await loadModels(preferredModelId);
  }, [loadModels]);

  const value = useMemo<AssistantPanelContextValue>(
    () => ({
      assistantOpen,
      sidebarCollapsed,
      toggleSidebar,
      toggleAssistant,
      messages,
      conversations,
      activeConversationId,
      activeConversationTitle,
      selectConversation: onSelectConversation,
      sendMessage,
      editLatestUserMessage: onEditLatestUserMessage,
      regenerateLatestAnswer: onRegenerateLatestAnswer,
      switchLatestCandidate: onSwitchLatestCandidate,
      createConversation: onNewConversation,
      isStreaming,
      modelList,
      currentModel,
      switchModel,
      refreshModels,
      assistMode,
      setAssistMode,
      selectedProject,
      setSelectedProject,
    }),
    [
      assistantOpen,
      sidebarCollapsed,
      toggleSidebar,
      toggleAssistant,
      messages,
      conversations,
      activeConversationId,
      activeConversationTitle,
      onSelectConversation,
      onEditLatestUserMessage,
      sendMessage,
      onNewConversation,
      onRegenerateLatestAnswer,
      onSwitchLatestCandidate,
      isStreaming,
      modelList,
      currentModel,
      switchModel,
      refreshModels,
      assistMode,
      selectedProject,
    ],
  );

  return <AssistantPanelContext.Provider value={value}>{children}</AssistantPanelContext.Provider>;
}

export function useAssistantPanel() {
  return useContext(AssistantPanelContext);
}
