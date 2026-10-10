import { getReplyVariant } from "../types/board";
import type { ReplyNode } from "../types/board";
import { SwipeControls } from "./SwipeControls";

function countReplies(replies: ReplyNode[]): number {
  return replies.reduce(
    (sum, reply) => sum + 1 + countReplies(reply.replies),
    0,
  );
}

interface ReplyNodeViewProps {
  reply: ReplyNode;
  topicId: string;
  depth: number;
  collapsed: Record<string, boolean>;
  unread: Record<string, boolean>;
  regeneratingNodeId: string | null;
  onToggle: (id: string) => void;
  onSimulateReply: (topicId: string, parentReplyId: string) => void;
  onHumanReply: (topicId: string, parentReplyId: string) => void;
  onDelete: (topicId: string, replyId: string) => void;
  onSwipe: (topicId: string, replyId: string, direction: -1 | 1) => void;
  onRegenerate: (topicId: string, replyId: string) => void;
}

export function ReplyNodeView({
  reply,
  topicId,
  depth,
  collapsed,
  unread,
  regeneratingNodeId,
  onToggle,
  onSimulateReply,
  onHumanReply,
  onDelete,
  onSwipe,
  onRegenerate,
}: ReplyNodeViewProps) {
  const variant = getReplyVariant(reply);
  const isCollapsed = collapsed[reply.id] ?? false;
  const hasUnread = isCollapsed && !!unread[reply.id];
  const childCount = countReplies(reply.replies);
  const isRegenerating = regeneratingNodeId === reply.id;

  const handleDelete = () => {
    const childNote =
      childCount > 0 ? ` This will also delete ${childCount} nested replies.` : "";
    if (window.confirm(`Delete this reply?${childNote}`)) {
      onDelete(topicId, reply.id);
    }
  };

  return (
    <div
      className={`border-l-2 pl-3 ${hasUnread ? "border-sky-300" : "border-slate-200"}`}
      style={{ marginLeft: depth > 0 ? 0 : undefined }}
    >
      <article
        data-unread={hasUnread ? "true" : undefined}
        className={`rounded-md px-3 py-2 ${
          isRegenerating ? "bg-amber-50" : hasUnread ? "bg-sky-50" : "bg-slate-50"
        }`}
      >
        <header className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => onToggle(reply.id)}
            className={`font-medium hover:text-slate-900 ${hasUnread ? "text-sky-700" : "text-slate-600"}`}
            disabled={childCount === 0}
          >
            {childCount > 0 ? (isCollapsed ? "▶" : "▼") : "•"}{" "}
            {childCount > 0 && isCollapsed ? `(${childCount} replies) ` : ""}
          </button>
          <span className="font-semibold text-slate-800">@{variant.username}</span>
          <span>{variant.source === "human" ? "human" : "simulated"}</span>
          <span>{new Date(variant.createdAt).toLocaleString()}</span>
        </header>
        <p className="whitespace-pre-wrap text-sm text-slate-800">{variant.content}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SwipeControls
            activeIndex={reply.activeVariant}
            total={reply.variants.length}
            onPrev={() => onSwipe(topicId, reply.id, -1)}
            onNext={() => onSwipe(topicId, reply.id, 1)}
            onRegenerate={() => onRegenerate(topicId, reply.id)}
            regenerating={isRegenerating}
          />
          <button
            type="button"
            onClick={() => onSimulateReply(topicId, reply.id)}
            className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            Simulate Reply
          </button>
          <button
            type="button"
            onClick={() => onHumanReply(topicId, reply.id)}
            className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            Reply
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </article>

      {!isCollapsed &&
        reply.replies.map((child) => (
          <div key={child.id} className="mt-2">
            <ReplyNodeView
              reply={child}
              topicId={topicId}
              depth={depth + 1}
              collapsed={collapsed}
              unread={unread}
              regeneratingNodeId={regeneratingNodeId}
              onToggle={onToggle}
              onSimulateReply={onSimulateReply}
              onHumanReply={onHumanReply}
              onDelete={onDelete}
              onSwipe={onSwipe}
              onRegenerate={onRegenerate}
            />
          </div>
        ))}
    </div>
  );
}
