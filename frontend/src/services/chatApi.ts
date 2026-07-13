const DEFAULT_API_BASE = "http://10.0.1.5:8765";
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
const API_BASE_CANDIDATES = import.meta.env.DEV && API_BASE !== ""
  ? [API_BASE, ""]
  : [API_BASE];

// ---- 流式事件类型 ----

export interface ChatStreamDelta {
  type: "delta";
  content: string;
  sequence: number;
}

export interface ChatStreamReasoning {
  type: "reasoning";
  content: string;
  done: boolean;
  turn_id: string;
  sequence: number;
}

export interface ChatStreamDone {
  type: "done";
  ok: boolean;
  reply: string;
  conversation_id: string;
  channel: string;
  session_key?: string;
  latency_ms: number;
  session_file_path?: string;
  tools_used: string[];
  stop_reason?: string;
  event_id?: string;
}

export type ChatStreamEvent = ChatStreamDelta | ChatStreamReasoning | ChatStreamDone;

export interface SendMessageResult {
  reply: string;
  conversationId: string;
  sessionKey?: string;
}

export interface SessionSummary {
  session_key: string;
  conversation_id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
}

// ---- 工具函数 ----

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response | null = null;
  let lastNetworkError: unknown = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });
      break;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (!response) {
    throw new Error(
      `${getErrorMessage(lastNetworkError, "无法连接后端服务")}。请确认后端服务已启动。`,
    );
  }

  const text = await response.text().catch(() => "");
  let envelope: { success: boolean; data: T; error?: { message?: string } } | null = null;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new Error(`响应解析失败：HTTP ${response.status}`);
  }

  if (!response.ok || !envelope?.success) {
    throw new Error(envelope?.error?.message || `请求失败：HTTP ${response.status}`);
  }

  return envelope.data;
}

// ---- 流式对话 ----

/**
 * 发送消息并获取流式回复。
 * 返回一个 ReadableStream reader，调用方逐行读取 JSON Lines 事件。
 */
export function sendMessageStream(
  message: string,
  conversationId = "default",
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const body = JSON.stringify({
    message,
    conversation_id: conversationId,
    channel: "runtime",
  });

  return (async () => {
    let response: Response | null = null;
    let lastNetworkError: unknown = null;

    for (const baseUrl of API_BASE_CANDIDATES) {
      try {
        response = await fetch(`${baseUrl}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        break;
      } catch (error) {
        lastNetworkError = error;
      }
    }

    if (!response) {
      throw new Error(
        `${getErrorMessage(lastNetworkError, "无法连接后端服务")}。请确认后端服务已启动。`,
      );
    }

    if (!response.ok) {
      throw new Error(`对话请求失败：HTTP ${response.status}`);
    }
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("浏览器不支持流式读取");
    }
    return reader;
  })();
}

/**
 * 发送消息并收集完整回复。
 * 适用于不需要展示逐字流式效果的场景。
 */
export async function sendMessage(
  message: string,
  conversationId = "default",
  onDelta?: (text: string) => void,
  onReasoning?: (text: string) => void,
): Promise<SendMessageResult> {
  const reader = await sendMessageStream(message, conversationId);

  const decoder = new TextDecoder();
  let buffer = "";
  let fullReply = "";
  let finalResult: SendMessageResult = { reply: "", conversationId };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // 最后一个可能是不完整的行
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const event: ChatStreamEvent = JSON.parse(trimmed);
        if (event.type === "delta") {
          fullReply += event.content;
          onDelta?.(event.content);
        } else if (event.type === "reasoning" && onReasoning) {
          onReasoning(event.content);
        } else if (event.type === "done") {
          if (event.ok) {
            // 防御：如果 done.reply 和已流式累加的内容相同，不做替换
            // 避免后端在 delta 和 done 中重复返回相同完整文本导致的潜在问题
            fullReply = event.reply && event.reply !== fullReply ? event.reply : fullReply;
            finalResult = {
              reply: fullReply,
              conversationId: event.conversation_id,
              sessionKey: event.session_key,
            };
          } else {
            throw new Error(event.stop_reason || "对话处理失败");
          }
        }
      } catch (error) {
        // 跳过解析失败的行（可能是 JSON 不完整），除非是业务错误
        if (error instanceof Error && error.message.includes("对话")) {
          throw error;
        }
      }
    }
  }

  return finalResult;
}

// ---- 运行时模型切换 ----

/** 切换当前对话使用的模型（上传到后端运行时） */
export async function switchRuntimeModel(modelConfigId: string): Promise<void> {
  await request("/api/runtime/model", {
    method: "POST",
    body: JSON.stringify({ modelConfigId }),
  });
}

// ---- 会话管理 ----

/** 获取会话列表 */
export async function listSessions(): Promise<SessionSummary[]> {
  return request("/api/sessions");
}

/** 获取单个会话详情 */
export async function getSession(sessionKey: string): Promise<{ messages: Array<{ role: string; content: string }> }> {
  return request(`/api/sessions/${encodeURIComponent(sessionKey)}`);
}

/** 删除会话 */
export async function deleteSession(sessionKey: string): Promise<void> {
  await request(`/api/sessions/${encodeURIComponent(sessionKey)}`, { method: "DELETE" });
}

// ---- 编辑与重生成 ----

/** 编辑最后一条消息 */
export async function editLatestMessage(
  conversationId: string,
  newMessage: string,
): Promise<SendMessageResult> {
  const reader = await sendMessageStream("__EDIT_LATEST__", conversationId);
  // 这个需要特殊的处理，暂时用简单方式
  return sendMessage(newMessage, conversationId);
}

export const chatApi = {
  sendMessage,
  sendMessageStream,
  switchRuntimeModel,
  listSessions,
  getSession,
  deleteSession,
};
