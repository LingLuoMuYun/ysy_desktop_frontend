const DEFAULT_API_BASE = "http://10.0.1.5:8765";
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
const API_BASE_CANDIDATES = import.meta.env.DEV && API_BASE !== ""
  ? [API_BASE, ""]
  : [API_BASE];

// ---- 流式事件类型 ----

export interface ChatStreamDelta {
  type: "delta";
  content: string;
  sequence?: number;
}

export interface ChatStreamReasoning {
  type: "reasoning";
  content: string;
  done: boolean;
  turn_id: string;
  sequence: number;
}

export interface ChatStreamTool {
  type: "tool";
  name: string;
  status: string;
  call_id: string;
  summary?: string;
  timestamp?: string;
  duration_ms?: number | null;
  detail?: string;
  sequence?: number;
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

export interface ChatStreamError {
  type: "error";
  ok: false;
  error: string;
}

export type ChatStreamEvent =
  | ChatStreamDelta
  | ChatStreamReasoning
  | ChatStreamTool
  | ChatStreamDone
  | ChatStreamError;

export interface SendMessageResult {
  reply: string;
  conversationId: string;
  sessionKey?: string;
}

export interface SendMessageOptions {
  modelConfigId?: string;
}

export interface RuntimeModelResult {
  modelConfigId: string;
  model?: string;
  providerName?: string;
  displayName?: string;
  contextLength?: number;
  maxOutput?: number;
  temperature?: number;
}

export interface SessionSummary {
  key: string;
  session_key: string;
  conversation_id: string;
  title?: string;
  preview?: string;
  created_at?: string;
  updated_at?: string;
  updated_at_text?: string;
  message_count?: number;
}

export interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
  candidate_id?: string;
  candidate_active?: boolean;
  candidate_index?: number;
}

export interface SessionDetail {
  key: string;
  messages: SessionMessage[];
}

// ---- 工具函数 ----

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getPayloadError(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload && "error" in payload) {
    return String((payload as { error?: unknown }).error || fallback);
  }
  return fallback;
}

function normalizeDeltaContent(currentReply: string, incomingContent: string) {
  if (!incomingContent) {
    return { nextReply: currentReply, chunk: "" };
  }

  if (incomingContent === currentReply) {
    return { nextReply: currentReply, chunk: "" };
  }

  if (incomingContent.startsWith(currentReply)) {
    const chunk = incomingContent.slice(currentReply.length);
    return { nextReply: incomingContent, chunk };
  }

  return {
    nextReply: `${currentReply}${incomingContent}`,
    chunk: incomingContent,
  };
}

function getStringField(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function getTimeField(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      const milliseconds = value > 10_000_000_000 ? value : value * 1000;
      return new Date(milliseconds).toISOString();
    }
  }
  return undefined;
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
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
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`响应解析失败：HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(getPayloadError(payload, `请求失败：HTTP ${response.status}`));
  }

  return payload;
}

async function openChatStream(
  path: string,
  body: Record<string, unknown>,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  let response: Response | null = null;
  let lastNetworkError: unknown = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    const text = await response.text().catch(() => "");
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      // 使用 HTTP 状态兜底。
    }
    throw new Error(getPayloadError(payload, `对话请求失败：HTTP ${response.status}`));
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("浏览器不支持流式读取");
  }
  return reader;
}

function normalizeSessionSummary(raw: unknown): SessionSummary | null {
  if (typeof raw !== "object" || !raw) return null;
  const session = raw as Record<string, unknown>;
  const key = getStringField(session, ["key", "session_key", "sessionKey"]) ?? "";
  if (!key) return null;

  const conversationId = getStringField(session, ["conversation_id", "conversationId"])
    ?? (key.includes(":")
      ? key.split(":").slice(1).join(":")
      : key);

  const messageCount = typeof session.message_count === "number"
    ? session.message_count
    : typeof session.messageCount === "number"
      ? session.messageCount
      : undefined;

  return {
    key,
    session_key: key,
    conversation_id: conversationId,
    title: getStringField(session, ["title", "name"]),
    preview: getStringField(session, ["preview", "summary", "last_message", "lastMessage"]),
    created_at: getTimeField(session, ["created_at", "createdAt", "ctime", "created_time", "createdTime"]),
    updated_at: getTimeField(session, ["updated_at", "updatedAt", "mtime", "modified_at", "modifiedAt", "updated_time", "updatedTime"]),
    updated_at_text: getStringField(session, ["updated_at_text", "updatedAtText", "updatedText", "timeText"]),
    message_count: messageCount,
  };
}

function getSessionMessageTimestamp(message: Record<string, unknown>) {
  const directTimestamp = getTimeField(message, ["timestamp", "created_at", "createdAt", "updated_at", "updatedAt"]);
  if (directTimestamp) return directTimestamp;

  const processEvents = message._process_events;
  if (!Array.isArray(processEvents)) return undefined;

  for (let index = processEvents.length - 1; index >= 0; index -= 1) {
    const event = processEvents[index];
    if (typeof event !== "object" || !event) continue;
    const timestamp = getTimeField(event as Record<string, unknown>, ["timestamp", "created_at", "createdAt"]);
    if (timestamp) return timestamp;
  }

  return undefined;
}

function normalizeSessionDetail(raw: unknown): SessionDetail {
  if (typeof raw !== "object" || !raw) {
    throw new Error("会话详情响应格式不符合预期");
  }

  const session = raw as { key?: unknown; messages?: unknown };
  const key = typeof session.key === "string" ? session.key : "";
  const messages = Array.isArray(session.messages)
    ? session.messages
        .map((message): SessionMessage | null => {
          if (typeof message !== "object" || !message) return null;
          const item = message as {
            role?: unknown;
            content?: unknown;
            timestamp?: unknown;
            candidate_id?: unknown;
            candidate_active?: unknown;
            candidate_index?: unknown;
            _process_events?: unknown;
          };
          if (typeof item.role !== "string" || typeof item.content !== "string") return null;
          return {
            role: item.role,
            content: item.content,
            timestamp: getSessionMessageTimestamp(item as Record<string, unknown>),
            candidate_id: typeof item.candidate_id === "string" ? item.candidate_id : undefined,
            candidate_active: typeof item.candidate_active === "boolean" ? item.candidate_active : undefined,
            candidate_index: typeof item.candidate_index === "number" ? item.candidate_index : undefined,
          };
        })
        .filter((message): message is SessionMessage => Boolean(message))
    : [];

  return { key, messages };
}

async function collectStreamResult(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  conversationId: string,
  onDelta?: (text: string) => void,
  onReasoning?: (text: string) => void,
): Promise<SendMessageResult> {
  const decoder = new TextDecoder();
  let buffer = "";
  let fullReply = "";
  let lastDeltaSequence: number | undefined;
  let finalResult: SendMessageResult = { reply: "", conversationId };

  async function processLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    let event: ChatStreamEvent;
    try {
      event = JSON.parse(trimmed) as ChatStreamEvent;
    } catch {
      return;
    }

    if (event.type === "delta") {
      const sequence = typeof event.sequence === "number" ? event.sequence : undefined;
      if (typeof event.sequence === "number" && event.sequence === lastDeltaSequence) {
        return;
      }
      const { nextReply, chunk } = normalizeDeltaContent(fullReply, event.content);
      fullReply = nextReply;
      if (sequence !== undefined) {
        lastDeltaSequence = sequence;
      }
      if (chunk) {
        onDelta?.(chunk);
      }
      return;
    }

    if (event.type === "reasoning") {
      onReasoning?.(event.content);
      return;
    }

    if (event.type === "error") {
      throw new Error(event.error || "对话处理失败");
    }

    if (event.type === "done") {
      if (!event.ok) {
        throw new Error(event.stop_reason || "对话处理失败");
      }
      const reply = event.reply || fullReply;
      finalResult = {
        reply,
        conversationId: event.conversation_id,
        sessionKey: event.session_key,
      };
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      await processLine(line);
    }
  }

  if (buffer.trim()) {
    await processLine(buffer);
  }

  return finalResult;
}

// ---- 流式对话 ----

/**
 * 发送消息并获取流式回复。
 * 返回一个 ReadableStream reader，调用方逐行读取 JSON Lines 事件。
 */
export function sendMessageStream(
  message: string,
  conversationId = "default",
  options: SendMessageOptions = {},
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  return openChatStream("/api/chat/stream", {
    message,
    conversation_id: conversationId,
    channel: "runtime",
    metadata: {
      ...(options.modelConfigId ? { modelConfigId: options.modelConfigId } : {}),
    },
  });
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
  options: SendMessageOptions = {},
): Promise<SendMessageResult> {
  const reader = await sendMessageStream(message, conversationId, options);
  return collectStreamResult(reader, conversationId, onDelta, onReasoning);
}

// ---- 运行时模型切换 ----

/** 切换当前对话使用的模型（上传到后端运行时） */
export async function switchRuntimeModel(modelConfigId: string): Promise<RuntimeModelResult> {
  const payload = await requestJson("/api/runtime/model", {
    method: "POST",
    body: JSON.stringify({ modelConfigId }),
  });

  if (typeof payload === "object" && payload && "success" in payload) {
    const envelope = payload as {
      success?: boolean;
      data?: RuntimeModelResult;
      error?: { message?: string } | null;
    };
    if (!envelope.success) {
      throw new Error(envelope.error?.message || "运行模型切换失败");
    }
    return envelope.data?.modelConfigId ? envelope.data : { modelConfigId };
  }

  if (typeof payload === "object" && payload && "ok" in payload) {
    const runtimePayload = payload as RuntimeModelResult & { ok?: boolean; error?: string };
    if (runtimePayload.ok) {
      return {
        ...runtimePayload,
        modelConfigId: runtimePayload.modelConfigId || modelConfigId,
      };
    }
    throw new Error(runtimePayload.error || "运行模型切换失败");
  }

  throw new Error("运行模型切换响应格式不符合预期");
}

// ---- 会话管理 ----

/** 获取会话列表 */
export async function listSessions(): Promise<SessionSummary[]> {
  const payload = await requestJson("/api/sessions");
  if (typeof payload !== "object" || !payload) {
    throw new Error("会话列表响应格式不符合预期");
  }
  const result = payload as { ok?: unknown; sessions?: unknown; error?: unknown };
  if (result.ok !== true) {
    throw new Error(getPayloadError(payload, "会话列表获取失败"));
  }
  if (!Array.isArray(result.sessions)) {
    throw new Error("会话列表响应缺少 sessions");
  }
  return result.sessions
    .map(normalizeSessionSummary)
    .filter((session): session is SessionSummary => Boolean(session));
}

/** 获取单个会话详情 */
export async function getSession(sessionKey: string): Promise<SessionDetail> {
  const payload = await requestJson(`/api/sessions/${encodeURIComponent(sessionKey)}`);
  if (typeof payload !== "object" || !payload) {
    throw new Error("会话详情响应格式不符合预期");
  }
  const result = payload as { ok?: unknown; session?: unknown; error?: unknown };
  if (result.ok !== true) {
    throw new Error(getPayloadError(payload, "会话详情获取失败"));
  }
  return normalizeSessionDetail(result.session);
}

/** 删除会话 */
export async function deleteSession(sessionKey: string): Promise<void> {
  const payload = await requestJson(`/api/sessions/${encodeURIComponent(sessionKey)}`, { method: "DELETE" });
  if (typeof payload !== "object" || !payload) {
    throw new Error("删除会话响应格式不符合预期");
  }
  const result = payload as { ok?: unknown; deleted?: unknown; error?: unknown };
  if (result.ok !== true || result.deleted === false) {
    throw new Error(getPayloadError(payload, "删除会话失败"));
  }
}

// ---- 编辑与重生成 ----

/** 编辑最后一条消息 */
export async function editLatestMessage(
  conversationId: string,
  newMessage: string,
): Promise<SendMessageResult> {
  const reader = await openChatStream("/api/chat/edit-latest", {
    message: newMessage,
    conversation_id: conversationId,
    channel: "runtime",
    metadata: {},
  });
  return collectStreamResult(reader, conversationId);
}

/** 重新生成最新回答 */
export async function regenerateLatestMessage(conversationId: string): Promise<SendMessageResult> {
  const reader = await openChatStream("/api/chat/regenerate-latest", {
    conversation_id: conversationId,
    channel: "runtime",
    metadata: {},
  });
  return collectStreamResult(reader, conversationId);
}

/** 切换最新回答候选版本 */
export async function switchLatestCandidate(
  conversationId: string,
  candidateId: string,
): Promise<SessionDetail> {
  const payload = await requestJson("/api/chat/switch-candidate", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId,
      channel: "runtime",
      candidate_id: candidateId,
    }),
  });
  if (typeof payload !== "object" || !payload) {
    throw new Error("候选回答切换响应格式不符合预期");
  }
  const result = payload as { ok?: unknown; session?: unknown; error?: unknown };
  if (result.ok !== true) {
    throw new Error(getPayloadError(payload, "候选回答切换失败"));
  }
  return normalizeSessionDetail(result.session);
}

/** 停止当前生成 */
export async function cancelChatGeneration(conversationId: string): Promise<{ cancelled: boolean; message?: string }> {
  const payload = await requestJson("/api/chat/cancel", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId,
      channel: "runtime",
    }),
  });
  if (typeof payload !== "object" || !payload) {
    throw new Error("停止生成响应格式不符合预期");
  }
  const result = payload as { ok?: unknown; cancelled?: unknown; message?: unknown; error?: unknown };
  if (result.ok !== true) {
    throw new Error(getPayloadError(payload, "停止生成失败"));
  }
  return {
    cancelled: result.cancelled === true,
    message: typeof result.message === "string" ? result.message : undefined,
  };
}

export const chatApi = {
  sendMessage,
  sendMessageStream,
  switchRuntimeModel,
  listSessions,
  getSession,
  deleteSession,
  editLatestMessage,
  regenerateLatestMessage,
  switchLatestCandidate,
  cancelChatGeneration,
};
