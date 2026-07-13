import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTypewriterStream } from "../hooks/useTypewriterStream";
import { assistantModelsApi } from "../services/assistantModelsApi";
import { chatApi } from "../services/chatApi";
import type { AssistantModelDetail } from "../types/domain";

// --- 对话共享状态类型 ---
export type AssistMode = "readonly" | "assist" | "confirm";

export interface PanelMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
}

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
  /** 从任意页面向助手面板发送消息（异步，等待 AI 回复） */
  sendMessage: (text: string) => Promise<void>;
  /** 清空消息 */
  clearMessages: () => void;
  /** 当前是否正在等待 AI 回复 */
  isStreaming: boolean;
  /** 模型列表 */
  modelList: AssistantModelDetail[];
  /** 当前使用的模型 */
  currentModel: AssistantModelDetail | null;
  /** 切换运行时模型 */
  switchModel: (modelConfigId: string) => Promise<void>;
  refreshModels: () => Promise<void>;
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
  sendMessage: async () => undefined,
  clearMessages: () => undefined,
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
}: {
  children: ReactNode;
  assistantOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleAssistant: () => void;
}) {
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelList, setModelList] = useState<AssistantModelDetail[]>([]);
  const [currentModel, setCurrentModel] = useState<AssistantModelDetail | null>(null);
  const [assistMode, setAssistMode] = useState<AssistMode>("assist");
  const [selectedProject, setSelectedProject] = useState("none");
  const msgCounter = useRef(0);
  const activeStreamRef = useRef<{
    assistantId: string;
    displayedText: string;
  } | null>(null);
  const loadModels = useCallback(async () => {
    const models = await assistantModelsApi.list();
    setModelList(models);
    setCurrentModel((current) => {
      if (current) {
        const refreshedCurrent = models.find((model) => model.id === current.id);
        if (refreshedCurrent) return refreshedCurrent;
      }
      return models.find((model) => model.isDefault) ?? models[0] ?? null;
    });
  }, []);

  // 加载模型列表
  useEffect(() => {
    let cancelled = false;

    async function loadInitialModels() {
      try {
        const models = await assistantModelsApi.list();
        if (cancelled) return;
        setModelList(models);
        const defaultModel = models.find((m) => m.isDefault) ?? models[0] ?? null;
        setCurrentModel(defaultModel);
      } catch {
        // 加载失败时静默处理，UI 会显示加载状态
      }
    }

    loadInitialModels();
    return () => { cancelled = true; };
  }, []);

  const updateActiveAssistantText = useCallback((text: string) => {
    const stream = activeStreamRef.current;
    if (!stream || !text) return;

    stream.displayedText += text;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === stream.assistantId
          ? { ...message, text: stream.displayedText }
          : message,
      ),
    );
  }, []);

  const typewriter = useTypewriterStream(updateActiveAssistantText);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    typewriter.reset();

    const time = getTimeLabel();
    const id = msgCounter.current++;
    const userMsg: PanelMessage = { id: `user-${id}`, role: "user", text: trimmed, time };
    const assistantId = `assistant-${id}`;

    // 先添加用户消息，AI 消息用占位
    const assistantMsg: PanelMessage = { id: assistantId, role: "assistant", text: "", time };
    activeStreamRef.current = { assistantId, displayedText: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      // 构建上下文（将历史消息作为多轮对话）
      const existingMessages = messages;
      const historyText = existingMessages.slice(-6).map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.text}`).join("\n");
      const fullMessage = existingMessages.length > 0
        ? `[对话历史]\n${historyText}\n\n[当前消息]\n${trimmed}`
        : trimmed;

      const result = await chatApi.sendMessage(
        fullMessage,
        "default",
        (delta) => typewriter.enqueue(delta),
      );

      typewriter.flush();
      const finalText = result.reply || activeStreamRef.current?.displayedText || "";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && last.id === assistantId) {
          updated[updated.length - 1] = { ...last, text: finalText, time };
        }
        return updated;
      });
    } catch (error) {
      typewriter.flush();
      const errorText = error instanceof Error ? error.message : "AI 回复失败";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && last.id === assistantId) {
          updated[updated.length - 1] = { ...last, text: errorText, time };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      activeStreamRef.current = null;
    }
  }, [messages, isStreaming, typewriter]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    msgCounter.current = 0;
  }, []);

  const switchModel = useCallback(async (modelConfigId: string) => {
    await chatApi.switchRuntimeModel(modelConfigId);
    const model = modelList.find((m) => m.id === modelConfigId) ?? null;
    setCurrentModel(model);
  }, [modelList]);

  const refreshModels = useCallback(async () => {
    await loadModels();
  }, [loadModels]);

  const value = useMemo<AssistantPanelContextValue>(
    () => ({
      assistantOpen,
      sidebarCollapsed,
      toggleSidebar,
      toggleAssistant,
      messages,
      sendMessage,
      clearMessages,
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
      sendMessage,
      clearMessages,
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
