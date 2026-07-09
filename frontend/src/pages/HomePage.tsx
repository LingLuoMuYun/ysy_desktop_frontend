import { useCallback, useRef, useState } from "react";
import { ArrowUp, Link2, Lightbulb, RefreshCw, X } from "lucide-react";
import { PromptToolbar, ProjectSelect, type SkillOption } from "../components/PromptToolbar";
import { suggestionSets, type SuggestionItem } from "../mocks/prototypeData";

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
}

interface ChatAttachment {
  name: string;
  path: string;
  /** 浏览器回退：保留原始 File 对象，当 path 为空时用它生成 blob URL 打开 */
  file?: File;
}

interface HomePageProps {
  /** 当前会话消息由 AppShell 注入，便于历史栏、新对话和顶部标题保持同步。 */
  messages?: ChatMessage[];
  onConversationTitleChange?: (title: string) => void;
  /** 首页只负责产生消息；会话持久化、置顶和切换逻辑由 AppShell 统一处理。 */
  onMessagesChange?: (messages: ChatMessage[], title: string) => void;
}

function getCurrentTimeLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function createAssistantReply(input: string) {
  if (input.length <= 8) {
    return "我先看了你的输入和当前上下文。建议从项目绑定、数据路径和运行环境三处开始确认，通常能最快定位问题。";
  }

  return "我已经收到你的需求。接下来可以先确认关联项目、输入数据和运行环境，再拆成可执行步骤；如果你愿意，我可以继续帮你整理成任务计划。";
}

export function HomePage({ messages = [], onConversationTitleChange, onMessagesChange }: HomePageProps = {}) {
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [planMode, setPlanMode] = useState(false);
  const [activeSkills, setActiveSkills] = useState<SkillOption[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentSuggestions = suggestionSets[currentSetIndex];
  const isChatting = messages.length > 0;

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const time = getCurrentTimeLabel();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      time,
      attachments: attachedFiles,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: createAssistantReply(trimmed),
      time,
    };

    const nextMessages = [...messages, userMessage, assistantMessage];
    const nextTitle = trimmed.slice(0, 18);
    onMessagesChange?.(nextMessages, nextTitle);
    onConversationTitleChange?.(nextTitle);
    setInputValue("");
    setAttachedFiles([]);
    textareaRef.current?.focus();
  }, [attachedFiles, inputValue, messages, onConversationTitleChange, onMessagesChange]);

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
    const mapped = files.map((file) => {
      const filePath = window.ysyDesktop?.getFilePath?.(file) ?? "";
      console.debug("[HomePage] handleFilesSelected:", {
        name: file.name,
        hasYsyDesktop: Boolean(window.ysyDesktop),
        path: filePath || "(empty)",
      });
      return { name: file.name, path: filePath, file };
    });
    setAttachedFiles(mapped);
    textareaRef.current?.focus();
  }, []);

  const handleAttachmentsSelected = useCallback((attachments: ChatAttachment[]) => {
    console.debug("[HomePage] handleAttachmentsSelected:", attachments.map((a) => ({ name: a.name, path: a.path })));
    setAttachedFiles(attachments);
    textareaRef.current?.focus();
  }, []);

  const handleOpenAttachment = useCallback(
    async (attachment: ChatAttachment) => {
      // 优先使用文件系统路径（Electron 环境）
      if (attachment.path) {
        try {
          await window.ysyDesktop?.openFile?.(attachment.path);
          return;
        } catch (error) {
          console.error("打开文件失败:", attachment.path, error);
        }
      }

      // 回退：使用 File 对象触发浏览器下载（避免二进制文件乱码）
      if (attachment.file) {
        const blobUrl = URL.createObjectURL(attachment.file);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = attachment.file.name;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        // 稍后释放 blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
      }

      console.warn("[HomePage] 无法打开文件：没有路径也没有 File 对象", attachment.name);
    },
    [],
  );

  const handleAttachmentClick = useCallback(
    (attachment: ChatAttachment) => (e: React.MouseEvent) => {
      e.stopPropagation();
      void handleOpenAttachment(attachment);
    },
    [handleOpenAttachment],
  );

  const handleAttachmentKeyDown = useCallback(
    (attachment: ChatAttachment) => (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        void handleOpenAttachment(attachment);
      }
    },
    [handleOpenAttachment],
  );

  const handleRemoveAttachment = useCallback((indexToRemove: number) => {
    setAttachedFiles((current) => current.filter((_attachment, index) => index !== indexToRemove));
    textareaRef.current?.focus();
  }, []);

  const attachmentList = attachedFiles.length > 0 && (
    <div className="prompt-attachments" aria-label="已选择附件">
      {attachedFiles.map((file, index) => (
        <span
          className="prompt-attachment"
          key={`${file.name}-${file.path}-${index}`}
        >
          <button
            className="prompt-attachment__open"
            type="button"
            title={file.path ? `打开 ${file.name}` : file.file ? `在浏览器中打开 ${file.name}` : `无法打开 ${file.name}`}
            disabled={!file.path && !file.file}
            onClick={handleAttachmentClick(file)}
            onKeyDown={handleAttachmentKeyDown(file)}
          >
            <Link2 size={13} />
            <span>{file.name}</span>
          </button>
          <button
            className="prompt-attachment__remove"
            type="button"
            title={`移除 ${file.name}`}
            aria-label={`移除 ${file.name}`}
            onClick={() => handleRemoveAttachment(index)}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
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
      className={`send-button${inputValue.trim() ? " send-button--active" : ""}`}
      type="button"
      title="发送"
      onClick={handleSend}
      disabled={!inputValue.trim()}
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
              placeholder="随心输入，描述你想做的事情..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
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
          <div className="home-chat__messages" aria-live="polite">
            {messages.map((message) => (
              <article
                className={`chat-message chat-message--${message.role}`}
                key={message.id}
              >
                <div className="chat-message__bubble">
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="chat-message__attachments" aria-label="消息附件">
                      {message.attachments.map((attachment, index) => (
                        <button
                          className="chat-message__attachment"
                          key={`${attachment.name}-${attachment.path}-${index}`}
                          type="button"
                          title={attachment.path ? `打开 ${attachment.name}` : attachment.file ? `在浏览器中打开 ${attachment.name}` : `无法打开 ${attachment.name}`}
                          disabled={!attachment.path && !attachment.file}
                          onClick={handleAttachmentClick(attachment)}
                          onKeyDown={handleAttachmentKeyDown(attachment)}
                        >
                          <Link2 size={13} />
                          <span>{attachment.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div>{message.text}</div>
                </div>
                <time>{message.time}</time>
              </article>
            ))}
          </div>

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
                placeholder="随心输入"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
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
