import { ArrowLeft, ArrowRight, Check, Copy, History, LoaderCircle, MessageSquarePlus, Pencil, RefreshCw, RotateCcw, SendHorizontal, Tag } from "lucide-react";
import { getTimePeriod } from "../pages/HomePage";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RouteKey } from "../app/router";
import {
  mapFilesToChatAttachments,
  MessageAttachmentList,
  SelectedAttachmentList,
  type ChatAttachment,
} from "../components/ChatAttachments";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { PromptToolbar, ProjectSelect } from "../components/PromptToolbar";
import { ScrollArea } from "../components/ScrollArea";
import { useAssistantPanel, type PanelMessage } from "./AssistantPanelContext";

interface AssistantPanelProps {
  activeRoute: RouteKey;
}

const assistantPrompts = [
  [
    "帮我检查当前项目的数据是否满足训练要求",
    "为什么今天 GPU 占用突然升高？",
    "把最近一次训练失败原因整理成修复计划",
  ],
  [
    "检查当前 CUDA 环境是否配置正确",
    "帮我配置 QLoRA 微调参数",
    "生成环境检查报告",
  ],
];

export function AssistantPanel({ activeRoute }: AssistantPanelProps) {
  const [promptSetIndex, setPromptSetIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const {
    messages,
    conversations,
    activeConversationId,
    activeConversationTitle,
    selectConversation,
    sendMessage,
    editLatestUserMessage,
    regenerateLatestAnswer,
    switchLatestCandidate,
    createConversation,
    isStreaming,
    currentModel,
  } = useAssistantPanel();
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [regeneratingAssistantMessageId, setRegeneratingAssistantMessageId] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [greetingComplete, setGreetingComplete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 首页不渲染此面板（首页用 HomePage 自己的对话 UI）
  if (activeRoute === "home") {
    return null;
  }

  const prompts = assistantPrompts[promptSetIndex];
  const hasMessages = messages.length > 0;
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");
  const panelTitle = hasMessages && activeConversationTitle ? activeConversationTitle : "新的对话";

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 打字机效果：空状态时逐字显示问候语
  useEffect(() => {
    if (hasMessages) return;

    const period = getTimePeriod();
    const fullText = `${period}好\n今天需要我做些什么？`;
    setDisplayedGreeting("");
    setGreetingComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedGreeting(fullText.slice(0, index + 1));
        index++;
      } else {
        setGreetingComplete(true);
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [hasMessages]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isStreaming) return;
    const attachments = attachedFiles;
    setDraft("");
    setAttachedFiles([]);
    setHistoryOpen(false);
    await sendMessage(trimmed, attachments);
    textareaRef.current?.focus();
  };

  const handleFilesSelected = useCallback((files: File[]) => {
    setAttachedFiles(mapFilesToChatAttachments(files));
    textareaRef.current?.focus();
  }, []);

  const handleAttachmentsSelected = useCallback((attachments: ChatAttachment[]) => {
    setAttachedFiles(attachments);
    textareaRef.current?.focus();
  }, []);

  const handleRemoveAttachment = useCallback((indexToRemove: number) => {
    setAttachedFiles((current) => current.filter((_attachment, index) => index !== indexToRemove));
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartEditMessage = (message: (typeof messages)[number]) => {
    setEditingMessageId(message.id);
    setEditingValue(message.text);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId("");
    setEditingValue("");
  };

  const handleSubmitEditMessage = async () => {
    const trimmed = editingValue.trim();
    if (!trimmed || isStreaming || regeneratingAssistantMessageId) return;
    const targetAssistantMessageId = latestAssistantMessage?.id ?? "";
    setRegeneratingAssistantMessageId(targetAssistantMessageId);
    setEditingMessageId("");
    setEditingValue("");
    try {
      await editLatestUserMessage(trimmed);
    } finally {
      setRegeneratingAssistantMessageId("");
    }
  };

  const handleRegenerateLatestAnswer = async () => {
    if (isStreaming || regeneratingAssistantMessageId) return;
    const targetAssistantMessageId = latestAssistantMessage?.id ?? "";
    setRegeneratingAssistantMessageId(targetAssistantMessageId);
    try {
      await regenerateLatestAnswer();
    } finally {
      setRegeneratingAssistantMessageId("");
    }
  };

  const handleCopyMessage = (message: PanelMessage) => {
    void navigator.clipboard.writeText(message.text).then(() => {
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(""), 2000);
    });
  };

  const handleSwitchAdjacentCandidate = (message: (typeof messages)[number], direction: -1 | 1) => {
    if (!message.candidates) return;
    const activeIndex = message.candidates.findIndex((candidate) => candidate.active);
    if (activeIndex < 0) return;
    const nextCandidate = message.candidates[activeIndex + direction];
    if (!nextCandidate) return;
    void switchLatestCandidate(nextCandidate.id);
  };

  const sendButton = (
    <button
      className={`send-button${draft.trim() && !isStreaming ? " send-button--active" : ""}`}
      disabled={!draft.trim() || isStreaming}
      type="button"
      title="发送"
      onClick={handleSend}
    >
      <SendHorizontal size={17} />
    </button>
  );

  return (
    <aside className="assistant-panel" aria-label="AI 助手">
      <div className="assistant-header">
        <div className="assistant-header__title-row">
          <strong title={panelTitle}>{panelTitle}</strong>
        </div>
        <div className="assistant-header__tools">
          <button
            type="button"
            title="标注（暂未实现）"
            aria-label="标注"
          >
            <Tag size={14} />
          </button>
          <button
            type="button"
            title="历史对话"
            aria-pressed={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
          >
            <History size={14} />
          </button>
          <button
            type="button"
            title="新建对话"
            onClick={() => {
              setHistoryOpen(false);
              createConversation();
            }}
            disabled={isStreaming}
          >
            <MessageSquarePlus size={14} />
          </button>
        </div>
      </div>

      {historyOpen ? (
        <div className="assistant-history" aria-label="历史对话">
          <div className="assistant-history__title">历史对话</div>
          {conversations.length > 0 ? (
            <ScrollArea className="assistant-history__list" aria-label="AI 助手历史对话列表">
              {conversations.map((conversation) => (
                <div
                  className={`assistant-history__item${
                    conversation.id === activeConversationId ? " assistant-history__item--active" : ""
                  }`}
                  key={conversation.id}
                >
                  <button
                    className="assistant-history__item-main"
                    type="button"
                    onClick={() => {
                      selectConversation(conversation.id);
                      setHistoryOpen(false);
                    }}
                  >
                    <span>{conversation.title}</span>
                    <time>{conversation.updatedAt}</time>
                  </button>
                </div>
              ))}
            </ScrollArea>
          ) : (
            <div className="assistant-history__empty">暂无历史对话</div>
          )}
        </div>
      ) : null}

      {hasMessages ? (
        <ScrollArea className="assistant-messages" aria-live="polite">
          {messages.map((msg) => (
            <article
              className={`chat-message chat-message--${msg.role}${
                msg.id === regeneratingAssistantMessageId ? " chat-message--regenerating" : ""
              }`}
              key={msg.id}
            >
              <div className="chat-message__bubble">
                <MessageAttachmentList attachments={msg.attachments} />
                {editingMessageId === msg.id ? (
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
                ) : msg.id === regeneratingAssistantMessageId ? (
                  <div className="chat-message__regenerating" aria-live="polite" role="status">
                    <LoaderCircle size={18} />
                    <span>生成中</span>
                  </div>
                ) : msg.text ? (
                  <div className="chat-message__content-wrap">
                    <div className="chat-message__content">
                      <MarkdownRenderer
                        content={msg.text}
                        isStreaming={
                          isStreaming &&
                          msg.role === "assistant" &&
                          msg.id === messages[messages.length - 1]?.id
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="chat-message__streaming">
                    <span className="chat-message__streaming-dot" />
                    <span className="chat-message__streaming-dot" />
                    <span className="chat-message__streaming-dot" />
                  </div>
                )}
                {msg.role === "assistant" && msg.candidates && msg.candidates.length > 1 ? (
                  <div className="chat-message__candidate-switch" aria-label="回答候选版本">
                    <button
                      disabled={isStreaming || msg.candidates.findIndex((candidate) => candidate.active) <= 0}
                      type="button"
                      aria-label="上一个回答版本"
                      onClick={() => handleSwitchAdjacentCandidate(msg, -1)}
                    >
                      <ArrowLeft size={13} />
                    </button>
                    <span>
                      {(msg.candidates.findIndex((candidate) => candidate.active) + 1) || 1}/{msg.candidates.length}
                    </span>
                    <button
                      disabled={
                        isStreaming ||
                        msg.candidates.findIndex((candidate) => candidate.active) >= msg.candidates.length - 1
                      }
                      type="button"
                      aria-label="下一个回答版本"
                      onClick={() => handleSwitchAdjacentCandidate(msg, 1)}
                    >
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="chat-message__meta">
                <time>{msg.time}</time>
                <div className="chat-message__actions">
                  {msg.role === "user" && msg.id === latestUserMessage?.id ? (
                    <button
                      disabled={isStreaming}
                      type="button"
                      onClick={() => handleStartEditMessage(msg)}
                    >
                      <Pencil size={13} />
                      编辑
                    </button>
                  ) : null}
                  {msg.role === "assistant" ? (
                    <button
                      disabled={!msg.text || isStreaming}
                      type="button"
                      onClick={() => handleCopyMessage(msg)}
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check size={13} />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          复制
                        </>
                      )}
                    </button>
                  ) : null}
                  {msg.role === "assistant" && msg.id === latestAssistantMessage?.id ? (
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
      ) : (
        <>
          <div className="assistant-empty">
            {displayedGreeting.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
                {i === arr.length - 1 ? (
                  <span className={`typewriter-cursor${greetingComplete ? " typewriter-cursor--blink" : ""}`}>|</span>
                ) : null}
              </span>
            ))}
          </div>
          <div className="assistant-suggestions">
            {prompts.map((prompt) => (
              <button key={prompt} onClick={() => setDraft(prompt)} type="button">
                {prompt}
              </button>
            ))}
            <button
              className="assistant-refresh"
              onClick={() => setPromptSetIndex((index) => (index + 1) % assistantPrompts.length)}
              type="button"
            >
              <RefreshCw size={13} />
              换一批
            </button>
          </div>
        </>
      )}

      <div className="assistant-composer">
        <SelectedAttachmentList
          attachments={attachedFiles}
          onRemove={handleRemoveAttachment}
          onAfterOpen={() => textareaRef.current?.focus()}
        />
        <textarea
          ref={textareaRef}
          aria-label="AI 助手输入"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? "AI 正在回复中..." : "随心输入"}
          value={draft}
          disabled={isStreaming}
        />
        <PromptToolbar
          className="assistant-composer__tools"
          sendButton={sendButton}
          onFilesSelected={handleFilesSelected}
          onAttachmentsSelected={handleAttachmentsSelected}
        />
        <ProjectSelect className="assistant-project" />
      </div>
    </aside>
  );
}
