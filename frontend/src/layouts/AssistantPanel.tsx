import { Bot, ChevronDown, History, MessageSquarePlus, RefreshCw, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RouteKey } from "../app/router";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { PromptToolbar, ProjectSelect } from "../components/PromptToolbar";
import { StatusBadge } from "../components/StatusBadge";
import type { AssistantModelDetail } from "../types/domain";
import { useAssistantPanel } from "./AssistantPanelContext";

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
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const {
    messages,
    sendMessage,
    clearMessages,
    isStreaming,
    modelList,
    currentModel,
    switchModel,
  } = useAssistantPanel();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 首页不渲染此面板（首页用 HomePage 自己的对话 UI）
  if (activeRoute === "home") {
    return null;
  }

  const prompts = assistantPrompts[promptSetIndex];
  const hasMessages = messages.length > 0;
  const availableModels = modelList.filter((m) => m.status === "可用");

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!modelDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [modelDropdownOpen]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isStreaming) return;
    setDraft("");
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSwitchModel = async (model: AssistantModelDetail) => {
    setModelDropdownOpen(false);
    if (model.id === currentModel?.id) return;
    try {
      await switchModel(model.id);
    } catch {
      // 切换失败时静默处理，UI 保持当前模型
    }
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
          <strong>AI 助手</strong>
          {/* 模型选择器 */}
          <div className="assistant-model-selector" ref={dropdownRef}>
            <button
              className="assistant-model-selector__trigger"
              type="button"
              onClick={() => setModelDropdownOpen((v) => !v)}
              title={currentModel ? `当前模型：${currentModel.name}` : "选择模型"}
            >
              <span className="assistant-model-selector__name">
                {currentModel?.name ?? "未选择模型"}
              </span>
              <ChevronDown size={12} />
            </button>
            {modelDropdownOpen && (
              <div className="assistant-model-selector__dropdown">
                {availableModels.length === 0 ? (
                  <div className="assistant-model-selector__empty">
                    暂无可用模型，请先在设置中添加
                  </div>
                ) : (
                  availableModels.map((model) => (
                    <button
                      key={model.id}
                      className={`assistant-model-selector__option${
                        model.id === currentModel?.id ? " assistant-model-selector__option--active" : ""
                      }`}
                      type="button"
                      onClick={() => handleSwitchModel(model)}
                    >
                      <div className="assistant-model-selector__option-main">
                        <span className="assistant-model-selector__option-name">{model.name}</span>
                        <StatusBadge label={model.status} tone={model.tone} />
                      </div>
                      <span className="assistant-model-selector__option-provider">
                        {model.provider}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="assistant-header__tools">
          <button type="button" title="历史对话">
            <History size={14} />
          </button>
          <button
            type="button"
            title="新建对话"
            onClick={clearMessages}
            disabled={isStreaming}
          >
            <MessageSquarePlus size={14} />
          </button>
        </div>
      </div>

      {hasMessages ? (
        <div className="assistant-messages" aria-live="polite">
          {messages.map((msg) => (
            <article
              className={`chat-message chat-message--${msg.role}`}
              key={msg.id}
            >
              <div className="chat-message__bubble">
                {msg.text ? (
                  <MarkdownRenderer
                    content={msg.text}
                    isStreaming={
                      isStreaming &&
                      msg.role === "assistant" &&
                      msg.id === messages[messages.length - 1]?.id
                    }
                  />
                ) : (
                  <div className="chat-message__streaming">
                    <span className="chat-message__streaming-dot" />
                    <span className="chat-message__streaming-dot" />
                    <span className="chat-message__streaming-dot" />
                  </div>
                )}
              </div>
              <time>{msg.time}</time>
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <>
          <div className="assistant-empty">
            <span className="assistant-empty__icon" aria-hidden="true">
              <Bot size={17} />
            </span>
            <span>{currentModel ? `使用 ${currentModel.name}` : "开始新的聊天"}</span>
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
        <textarea
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
        />
        <ProjectSelect className="assistant-project" />
      </div>
    </aside>
  );
}
