import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, MessageSquareText, Pencil, Trash2, X } from "lucide-react";
import { ScrollArea } from "../components/ScrollArea";
import type { ConversationSummary } from "./conversationTypes";

interface ConversationHistoryPanelProps {
  activeConversationId: string;
  conversations: ConversationSummary[];
  error?: string;
  loading?: boolean;
  open: boolean;
  onDeleteConversation?: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationHistoryPanel({
  activeConversationId,
  conversations,
  error,
  loading = false,
  open,
  onDeleteConversation,
  onRenameConversation,
  onSelectConversation,
}: ConversationHistoryPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    conversationId: string;
    x: number;
    y: number;
  } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // 进入重命名模式时自动聚焦并全选
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleStartRename = useCallback((conversationId: string, title: string) => {
    setRenamingId(conversationId);
    setRenameValue(title);
    setContextMenu(null);
  }, []);

  const handleSubmitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRenameConversation?.(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  }, [renamingId, renameValue, onRenameConversation]);

  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmitRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelRename();
      }
    },
    [handleSubmitRename, handleCancelRename],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, conversationId: string) => {
      e.preventDefault();
      setContextMenu({ conversationId, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

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
              }${renamingId === conversation.id ? " conversation-history__item--renaming" : ""}`}
              key={conversation.id}
              onContextMenu={(e) => handleContextMenu(e, conversation.id)}
            >
              {renamingId === conversation.id ? (
                <div className="conversation-history__rename">
                  <input
                    ref={renameInputRef}
                    className="conversation-history__rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleSubmitRename}
                    placeholder="输入新名称"
                  />
                  <button
                    className="conversation-history__rename-confirm"
                    type="button"
                    title="确认"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSubmitRename();
                    }}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    className="conversation-history__rename-cancel"
                    type="button"
                    title="取消"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCancelRename();
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="conversation-history__item-main"
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    onDoubleClick={() => handleStartRename(conversation.id, conversation.title)}
                    title="双击重命名"
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
                </>
              )}
            </div>
          ))}
        </ScrollArea>
      ) : (
        <div className="conversation-history__empty">
          <MessageSquareText size={22} />
          <span>暂无历史对话</span>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu &&
        createPortal(
          <div
            className="context-menu-backdrop"
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCloseContextMenu();
            }}
          >
            <div
              className="context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              role="menu"
            >
              <button
                className="context-menu__item"
                type="button"
                role="menuitem"
                onClick={() => {
                  const conv = conversations.find((c) => c.id === contextMenu.conversationId);
                  if (conv) handleStartRename(conv.id, conv.title);
                }}
              >
                <Pencil size={13} />
                重命名
              </button>
              {onDeleteConversation ? (
                <button
                  className="context-menu__item context-menu__item--danger"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDeleteConversation(contextMenu.conversationId);
                    handleCloseContextMenu();
                  }}
                >
                  <Trash2 size={13} />
                  删除
                </button>
              ) : null}
            </div>
          </div>,
          document.body,
        )}
    </aside>
  );
}
