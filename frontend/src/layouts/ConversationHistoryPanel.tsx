import { MessageSquareText } from "lucide-react";
import type { ConversationSummary } from "./conversationTypes";

interface ConversationHistoryPanelProps {
  activeConversationId: string;
  conversations: ConversationSummary[];
  open: boolean;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationHistoryPanel({
  activeConversationId,
  conversations,
  open,
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
      {conversations.length > 0 ? (
        <div className="conversation-history__list">
          {conversations.map((conversation) => (
            <button
              className={`conversation-history__item${
                conversation.id === activeConversationId ? " conversation-history__item--active" : ""
              }`}
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <span className="conversation-history__item-title">{conversation.title}</span>
              <time>{conversation.updatedAt}</time>
            </button>
          ))}
        </div>
      ) : (
        <div className="conversation-history__empty">
          <MessageSquareText size={22} />
          <span>暂无历史对话</span>
        </div>
      )}
    </aside>
  );
}
