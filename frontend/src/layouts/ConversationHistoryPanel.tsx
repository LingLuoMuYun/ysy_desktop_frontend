import { Loader2, MessageSquareText, Trash2 } from "lucide-react";
import { ScrollArea } from "../components/ScrollArea";
import type { ConversationSummary } from "./conversationTypes";

interface ConversationHistoryPanelProps {
  activeConversationId: string;
  conversations: ConversationSummary[];
  error?: string;
  loading?: boolean;
  open: boolean;
  onDeleteConversation?: (conversationId: string) => void;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationHistoryPanel({
  activeConversationId,
  conversations,
  error,
  loading = false,
  open,
  onDeleteConversation,
  onSelectConversation,
}: ConversationHistoryPanelProps) {
  return (
    <aside
      className={`conversation-history${open ? " conversation-history--open" : ""}`}
      aria-label="对话历史"
      aria-hidden={!open}
    >
      <div className="conversation-history__header">
        <h2>对话历史</h2>
      </div>

      {/* 空白新对话不进入历史列表，避免用户看到不可恢复内容。 */}
      {loading ? (
        <div className="conversation-history__empty">
          <Loader2 size={22} />
          <span>正在加载历史对话</span>
        </div>
      ) : error ? (
        <div className="conversation-history__empty" role="alert">
          <MessageSquareText size={22} />
          <span>{error}</span>
        </div>
      ) : conversations.length > 0 ? (
        <ScrollArea className="conversation-history__list" aria-label="对话历史列表">
          {conversations.map((conversation) => (
            <div
              className={`conversation-history__item${
                conversation.id === activeConversationId ? " conversation-history__item--active" : ""
              }`}
              key={conversation.id}
            >
              <button
                className="conversation-history__item-main"
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <span className="conversation-history__item-title">{conversation.title}</span>
                <time>{conversation.updatedAt}</time>
              </button>
              {onDeleteConversation ? (
                <button
                  className="conversation-history__delete"
                  type="button"
                  aria-label={`删除 ${conversation.title}`}
                  title="删除对话"
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  <Trash2 size={13} />
                </button>
              ) : null}
            </div>
          ))}
        </ScrollArea>
      ) : (
        <div className="conversation-history__empty">
          <MessageSquareText size={22} />
          <span>暂无历史对话</span>
        </div>
      )}
    </aside>
  );
}
