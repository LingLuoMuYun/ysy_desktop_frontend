import type { ChatMessage } from "../pages/HomePage";

/**
 * 首页历史会话的前端展示模型。
 * 后续接入后端 sessions 时，key/session_key 可在此处扩展，不建议让 HomePage 直接依赖接口 DTO。
 */
export interface ConversationSummary {
  id: string;
  sessionKey?: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  source?: "local" | "server";
}
