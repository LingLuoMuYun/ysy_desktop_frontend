import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

// --- 对话共享状态类型 ---
export type AssistMode = "readonly" | "assist" | "confirm";
export type ModelOption = "deepseek" | "qwen" | "openai";

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

function generateReply(input: string) {
  if (input.includes("检测环境")) {
    return `已收到环境检测请求。正在对 ${input.replace("检测环境：", "")} 进行全项检查，请稍候查看检测结果...`;
  }
  if (input.includes("检测模型") || input.includes("连接测试")) {
    return `已收到模型检测请求。正在对 ${input.replace("检测模型：", "").replace("连接测试：", "")} 进行连通性测试与参数校验，请稍候...`;
  }
  return "已收到你的消息，我来帮你分析。可以告诉我更多细节吗？";
}

interface DialogState {
  assistMode: AssistMode;
  modelOption: ModelOption;
  selectedProject: string;
  setAssistMode: (mode: AssistMode) => void;
  setModelOption: (model: ModelOption) => void;
  setSelectedProject: (project: string) => void;
}

// --- 面板 UI 状态 ---
interface AssistantPanelContextValue extends DialogState {
  assistantOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleAssistant: () => void;
  /** 共享消息列表（跨页面保持） */
  messages: PanelMessage[];
  /** 从任意页面向助手面板发送消息 */
  sendMessage: (text: string) => void;
  /** 清空消息 */
  clearMessages: () => void;
}

const AssistantPanelContext = createContext<AssistantPanelContextValue>({
  assistantOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => undefined,
  toggleAssistant: () => undefined,
  assistMode: "assist",
  modelOption: "deepseek",
  selectedProject: "none",
  setAssistMode: () => undefined,
  setModelOption: () => undefined,
  setSelectedProject: () => undefined,
  messages: [],
  sendMessage: () => undefined,
  clearMessages: () => undefined,
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
  // 对话共享状态 —— 由 Provider 托管，跨页面保持
  const [assistMode, setAssistMode] = useState<AssistMode>("assist");
  const [modelOption, setModelOption] = useState<ModelOption>("deepseek");
  const [selectedProject, setSelectedProject] = useState("none");
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const msgCounter = useRef(0);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const time = getTimeLabel();
    const id = msgCounter.current++;

    const userMsg: PanelMessage = { id: `user-${id}`, role: "user", text: trimmed, time };
    const assistantMsg: PanelMessage = { id: `assistant-${id}`, role: "assistant", text: generateReply(trimmed), time };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    msgCounter.current = 0;
  }, []);

  const value = useMemo<AssistantPanelContextValue>(
    () => ({
      assistantOpen,
      sidebarCollapsed,
      toggleSidebar,
      toggleAssistant,
      assistMode,
      modelOption,
      selectedProject,
      setAssistMode,
      setModelOption,
      setSelectedProject,
      messages,
      sendMessage,
      clearMessages,
    }),
    [assistantOpen, sidebarCollapsed, toggleSidebar, toggleAssistant, assistMode, modelOption, selectedProject, messages, sendMessage, clearMessages],
  );

  return <AssistantPanelContext.Provider value={value}>{children}</AssistantPanelContext.Provider>;
}

export function useAssistantPanel() {
  return useContext(AssistantPanelContext);
}
