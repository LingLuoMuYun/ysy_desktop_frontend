import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, Check, LoaderCircle, Lightbulb, Pencil, RefreshCw, RotateCcw, X } from "lucide-react";
import {
  mapFilesToChatAttachments,
  MessageAttachmentList,
  SelectedAttachmentList,
  type ChatAttachment,
} from "../components/ChatAttachments";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { PromptToolbar, ProjectSelect, type SkillOption } from "../components/PromptToolbar";
import { ScrollArea } from "../components/ScrollArea";
import { useAssistantPanel } from "../layouts/AssistantPanelContext";
import { suggestionSets, type SuggestionItem } from "../mocks/prototypeData";
import { chatApi } from "../services/chatApi";

const CATEGORY_COLORS: Record<SuggestionItem["category"], string> = {
  数据: "#1f9d66",
  训练: "#3377ff",
  环境: "#b7791f",
  模型: "#8b5cf6",
  推理: "#e85d5d",
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  attachments?: ChatAttachment[];
  candidateId?: string;
  candidateActive?: boolean;
  candidateIndex?: number;
  candidates?: Array<{
    id: string;
    text: string;
    index: number;
    active: boolean;
    time?: string;
  }>;
}

interface HomePageProps {
  /** 后端对话会话 ID，必须跟 AppShell 当前会话保持一致。 */
  conversationId?: string;
  /** 当前会话消息由 AppShell 注入，便于历史栏、新对话和顶部标题保持同步。 */
  messages?: ChatMessage[];
  onConversationTitleChange?: (title: string) => void;
  /** 首页只负责产生消息；会话持久化、置顶和切换逻辑由 AppShell 统一处理。 */
  onMessagesChange?: (messages: ChatMessage[], title: string) => void;
  onEditLatestUserMessage?: (message: string) => Promise<void>;
  onRegenerateLatestAnswer?: () => Promise<void>;
  onSwitchLatestCandidate?: (candidateId: string) => Promise<void>;
}

function getCurrentTimeLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function HomePage({
  conversationId = "default",
  messages = [],
  onConversationTitleChange,
  onMessagesChange,
  onEditLatestUserMessage,
  onRegenerateLatestAnswer,
  onSwitchLatestCandidate,
}: HomePageProps = {}) {
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const [activeSkills, setActiveSkills] = useState<SkillOption[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [regeneratingAssistantMessageId, setRegeneratingAssistantMessageId] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { currentModel, refreshModels } = useAssistantPanel();

  const currentSuggestions = suggestionSets[currentSetIndex];
  const isChatting = messages.length > 0;
  const latestMessage = messages[messages.length - 1];
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
  const getActiveCandidate = (message: ChatMessage) => message.candidates?.find((candidate) => candidate.active);

  useEffect(() => {
    if (!isChatting) return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isChatting, latestMessage?.id, latestMessage?.text]);

  // 进入首页时刷新模型元数据；只有默认模型变化时才自动覆盖当前使用模型。
  useEffect(() => {
    refreshModels().catch(() => {
      // 刷新失败时继续使用上下文中已有的模型
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    const time = getCurrentTimeLabel();
    const assistantId = `assistant-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      time,
      attachments: attachedFiles,
    };
    // 先放一个空占位，流式更新填充
    const placeholderMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      time,
    };

    const nextMessages = [...messages, userMessage, placeholderMessage];
    const nextTitle = trimmed.slice(0, 18);
    onMessagesChange?.(nextMessages, nextTitle);
    onConversationTitleChange?.(nextTitle);
    setInputValue("");
    setAttachedFiles([]);
    setIsStreaming(true);

    try {
      let replyText = "";
      const result = await chatApi.sendMessage(
        trimmed,
        conversationId,
        // onDelta: 流式更新 AI 回复
        (delta) => {
          replyText += delta;
          onMessagesChange?.(
            nextMessages.map((m) =>
              m.id === assistantId ? { ...m, text: replyText } : m,
            ),
            nextTitle,
          );
        },
        undefined,
        { modelConfigId: currentModel?.id },
      );
      // 确保最终文本完整
      const finalReply = result.reply || replyText;
      onMessagesChange?.(
        nextMessages.map((m) =>
          m.id === assistantId ? { ...m, text: finalReply, time: getCurrentTimeLabel() } : m,
        ),
        nextTitle,
      );
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "AI 回复失败，请重试";
      onMessagesChange?.(
        nextMessages.map((m) =>
          m.id === assistantId ? { ...m, text: errorText, time: getCurrentTimeLabel() } : m,
        ),
        nextTitle,
      );
    } finally {
      setIsStreaming(false);
      textareaRef.current?.focus();
    }
  }, [
    attachedFiles,
    conversationId,
    currentModel?.id,
    inputValue,
    messages,
    onConversationTitleChange,
    onMessagesChange,
    isStreaming,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleSuggestionClick = useCallback((text: string) => {
    setInputValue(text);
    textareaRef.current?.focus();
  }, []);

  const handleRefreshSuggestions = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentSetIndex((prev) => (prev + 1) % suggestionSets.length);
      setIsFading(false);
    }, 200);
  }, []);

  const handleTogglePlanMode = useCallback(() => {
    setPlanMode((prev) => !prev);
  }, []);

  const handleToggleSkill = useCallback((skill: SkillOption) => {
    setActiveSkills((prev) => {
      const exists = prev.some((s) => s.key === skill.key);
      if (exists) {
        return prev.filter((s) => s.key !== skill.key);
      }
      return [...prev, skill];
    });
  }, []);

  const handleRemoveSkill = useCallback((skillKey: string) => {
    setActiveSkills((prev) => prev.filter((s) => s.key !== skillKey));
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    setAttachedFiles(mapFilesToChatAttachments(files));
    textareaRef.current?.focus();
  }, []);

  const handleStartEditMessage = useCallback((message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingValue(message.text);
  }, []);

  const handleCancelEditMessage = useCallback(() => {
    setEditingMessageId("");
    setEditingValue("");
  }, []);

  const handleSubmitEditMessage = useCallback(async () => {
    const trimmed = editingValue.trim();
    if (!trimmed || !onEditLatestUserMessage || isStreaming) return;
    const targetAssistantMessageId = latestAssistantMessage?.id ?? "";
    setRegeneratingAssistantMessageId(targetAssistantMessageId);
    setEditingMessageId("");
    setEditingValue("");
    try {
      await onEditLatestUserMessage(trimmed);
    } finally {
      setRegeneratingAssistantMessageId("");
    }
  }, [editingValue, isStreaming, latestAssistantMessage?.id, onEditLatestUserMessage]);

  const handleRegenerateLatestAnswer = useCallback(async () => {
    if (!onRegenerateLatestAnswer || isStreaming || regeneratingAssistantMessageId) return;
    const targetAssistantMessageId = latestAssistantMessage?.id ?? "";
    setRegeneratingAssistantMessageId(targetAssistantMessageId);
    try {
      await onRegenerateLatestAnswer();
    } finally {
      setRegeneratingAssistantMessageId("");
    }
  }, [isStreaming, latestAssistantMessage?.id, onRegenerateLatestAnswer, regeneratingAssistantMessageId]);

  const handleSwitchAdjacentCandidate = useCallback((message: ChatMessage, direction: -1 | 1) => {
    if (!message.candidates || !onSwitchLatestCandidate) return;
    const activeIndex = message.candidates.findIndex((candidate) => candidate.active);
    if (activeIndex < 0) return;
    const nextCandidate = message.candidates[activeIndex + direction];
    if (!nextCandidate) return;
    void onSwitchLatestCandidate(nextCandidate.id);
  }, [onSwitchLatestCandidate]);

  const handleAttachmentsSelected = useCallback((attachments: ChatAttachment[]) => {
    setAttachedFiles(attachments);
    textareaRef.current?.focus();
  }, []);

  const handleRemoveAttachment = useCallback((indexToRemove: number) => {
    setAttachedFiles((current) => current.filter((_attachment, index) => index !== indexToRemove));
    textareaRef.current?.focus();
  }, []);

  const attachmentList = (
    <SelectedAttachmentList
      attachments={attachedFiles}
      onRemove={handleRemoveAttachment}
      onAfterOpen={() => textareaRef.current?.focus()}
    />
  );

  const planModeBadge = planMode && (
    <div className="prompt-plan-badge" aria-label="Plan 模式已启用">
      <span className="prompt-plan-badge__label">
        <Lightbulb size={13} />
        <span>Plan 模式</span>
      </span>
      <button
        className="prompt-plan-badge__remove"
        type="button"
        title="关闭 Plan 模式"
        aria-label="关闭 Plan 模式"
        onClick={handleTogglePlanMode}
      >
        <X size={12} />
      </button>
    </div>
  );

  const skillsBadges = activeSkills.length > 0 && (
    <>
      {activeSkills.map((skill) => (
        <div
          className="prompt-skill-badge"
          key={skill.key}
          aria-label={`Skill: ${skill.label}`}
          style={{ "--skill-color": skill.color } as React.CSSProperties}
        >
          <span className="prompt-skill-badge__label">
            <span className="prompt-skill-badge__dot" />
            <span>{skill.label}</span>
          </span>
          <button
            className="prompt-skill-badge__remove"
            type="button"
            title={`移除 ${skill.label}`}
            aria-label={`移除 ${skill.label}`}
            onClick={() => handleRemoveSkill(skill.key)}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </>
  );

  const hasTopBadges = planMode || activeSkills.length > 0;

  const sendButton = (
    <button
      className={`send-button${inputValue.trim() && !isStreaming ? " send-button--active" : ""}`}
      type="button"
      title="发送"
      onClick={handleSend}
      disabled={!inputValue.trim() || isStreaming}
    >
      <ArrowUp size={18} />
    </button>
  );

  return (
    <section className={`home-page${isChatting ? " home-page--chat" : ""}`}>
      {!isChatting ? (
        <div className="home-center">
          <h1>今天想让这台机器帮你做什么？</h1>

          {/* 对话框 */}
          <div className="prompt-box">
            {attachmentList}
            {hasTopBadges && (
              <div className="prompt-badges">
                {planModeBadge}
                {skillsBadges}
              </div>
            )}

            <textarea
              ref={textareaRef}
              className="prompt-input"
              placeholder={isStreaming ? "AI 正在回复中..." : "随心输入，描述你想做的事情..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isStreaming}
            />

            <PromptToolbar
              sendButton={sendButton}
              onFilesSelected={handleFilesSelected}
              onAttachmentsSelected={handleAttachmentsSelected}
              onPlanModeToggle={handleTogglePlanMode}
              onSkillToggle={handleToggleSkill}
            />

            <ProjectSelect />
          </div>

          {/* 推荐词盒子 */}
          <div className={`suggestion-list${isFading ? " suggestion-list--fading" : ""}`}>
            {currentSuggestions.map((item) => (
              <button
                className="suggestion-bubble"
                key={item.id}
                type="button"
                onClick={() => handleSuggestionClick(item.text)}
                title={`点击填入：${item.text}`}
              >
                <span
                  className="suggestion-category"
                  style={{ color: CATEGORY_COLORS[item.category] }}
                >
                  {item.category}
                </span>
                <span className="suggestion-text">{item.text}</span>
              </button>
            ))}
            <button
              className="suggestion-refresh"
              type="button"
              onClick={handleRefreshSuggestions}
              title="换一批推荐"
            >
              <RefreshCw size={14} />
              换一批
            </button>
          </div>
        </div>
      ) : (
        <div className="home-chat">
          <ScrollArea className="home-chat__messages" aria-live="polite">
            {messages.map((message) => (
              <article
                className={`chat-message chat-message--${message.role}${
                  message.id === regeneratingAssistantMessageId ? " chat-message--regenerating" : ""
                }`}
                key={message.id}
              >
                <div className="chat-message__bubble">
                  <MessageAttachmentList attachments={message.attachments} />
                  {editingMessageId === message.id ? (
                    <div className="chat-message__edit">
                      <textarea
                        aria-label="编辑消息"
                        onChange={(event) => setEditingValue(event.target.value)}
                        rows={3}
                        value={editingValue}
                      />
                      <div className="chat-message__edit-actions">
                        <button type="button" onClick={handleCancelEditMessage}>
                          取消
                        </button>
                        <button
                          className="chat-message__action-primary"
                          disabled={!editingValue.trim() || isStreaming}
                          type="button"
                          onClick={() => void handleSubmitEditMessage()}
                        >
                          <Check size={13} />
                          保存并重新生成
                        </button>
                      </div>
                    </div>
                  ) : message.text ? (
                    <div className="chat-message__content-wrap">
                      <div className="chat-message__content">
                        <MarkdownRenderer
                          content={message.text}
                          isStreaming={
                            isStreaming &&
                            message.role === "assistant" &&
                            message.id === messages[messages.length - 1]?.id
                          }
                        />
                      </div>
                      {message.id === regeneratingAssistantMessageId ? (
                        <div className="chat-message__loading-overlay" aria-live="polite" role="status">
                          <LoaderCircle size={20} />
                          <span>生成中</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="chat-message__streaming">
                      <span className="chat-message__streaming-dot" />
                      <span className="chat-message__streaming-dot" />
                      <span className="chat-message__streaming-dot" />
                    </div>
                  )}
                  {message.role === "assistant" && message.candidates && message.candidates.length > 1 ? (
                    <div className="chat-message__candidate-switch" aria-label="回答候选版本">
                      <button
                        disabled={isStreaming || message.candidates.findIndex((candidate) => candidate.active) <= 0}
                        type="button"
                        aria-label="上一个回答版本"
                        onClick={() => handleSwitchAdjacentCandidate(message, -1)}
                      >
                        <ArrowLeft size={13} />
                      </button>
                      <span>
                        {(message.candidates.findIndex((candidate) => candidate.active) + 1) || 1}/{message.candidates.length}
                      </span>
                      <button
                        disabled={
                          isStreaming ||
                          message.candidates.findIndex((candidate) => candidate.active) >= message.candidates.length - 1
                        }
                        type="button"
                        aria-label="下一个回答版本"
                        onClick={() => handleSwitchAdjacentCandidate(message, 1)}
                      >
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="chat-message__meta">
                  <time>{getActiveCandidate(message)?.time || message.time}</time>
                  <div className="chat-message__actions">
                    {message.role === "user" && message.id === latestUserMessage?.id && onEditLatestUserMessage ? (
                      <button
                        disabled={isStreaming}
                        type="button"
                        onClick={() => handleStartEditMessage(message)}
                      >
                        <Pencil size={13} />
                        编辑
                      </button>
                    ) : null}
                    {message.role === "assistant" && message.id === latestAssistantMessage?.id && onRegenerateLatestAnswer ? (
                      <button
                        disabled={isStreaming || Boolean(regeneratingAssistantMessageId)}
                        type="button"
                        onClick={() => void handleRegenerateLatestAnswer()}
                      >
                        <RotateCcw size={13} />
                        重新生成
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="chat-composer">
            <div className="prompt-box prompt-box--chat">
              {attachmentList}
              {hasTopBadges && (
                <div className="prompt-badges">
                  {planModeBadge}
                  {skillsBadges}
                </div>
              )}

              <textarea
                ref={textareaRef}
                className="prompt-input prompt-input--chat"
                placeholder={isStreaming ? "AI 正在回复中..." : "随心输入"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isStreaming}
              />
              <PromptToolbar
                sendButton={sendButton}
                className="prompt-tools prompt-tools--chat"
                onFilesSelected={handleFilesSelected}
                onAttachmentsSelected={handleAttachmentsSelected}
                onPlanModeToggle={handleTogglePlanMode}
                onSkillToggle={handleToggleSkill}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
