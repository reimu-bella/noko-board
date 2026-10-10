import { getTopicVariant } from "../types/board";
import type { TopicPost } from "../types/board";
import { countReplyTree } from "../lib/tree";
import { ReplyNodeView } from "./ReplyNode";
import { SwipeControls } from "./SwipeControls";

interface TopicCardProps {
  topic: TopicPost;
  collapsed: Record<string, boolean>;
  unread: Record<string, boolean>;
  regeneratingNodeId: string | null;
  onToggle: (id: string) => void;
  onSimulateReply: (topicId: string, parentReplyId: string | null) => void;
  onHumanReply: (topicId: string, parentReplyId: string | null) => void;
  onDelete: (topicId: string) => void;
  onDeleteReply: (topicId: string, replyId: string) => void;
  onSwipe: (topicId: string, direction: -1 | 1) => void;
  onSwipeReply: (topicId: string, replyId: string, direction: -1 | 1) => void;
  onRegenerate: (topicId: string) => void;
  onRegenerateReply: (topicId: string, replyId: string) => void;
  onToggleHiddenFromContext: (topicId: string) => void;
}

export function TopicCard({
  topic,
  collapsed,
  unread,
  regeneratingNodeId,
  onToggle,
  onSimulateReply,
  onHumanReply,
  onDelete,
  onDeleteReply,
  onSwipe,
  onSwipeReply,
  onRegenerate,
  onRegenerateReply,
  onToggleHiddenFromContext,
}: TopicCardProps) {
  const variant = getTopicVariant(topic);
  const isCollapsed = collapsed[topic.id] ?? false;
  const hasUnread = isCollapsed && !!unread[topic.id];
  const replyCount = countReplyTree(topic.replies);
  const isRegenerating = regeneratingNodeId === topic.id;

  const handleDelete = () => {
    const replyNote =
      replyCount > 0 ? ` This will also delete ${replyCount} replies.` : "";
    if (window.confirm(`Delete this topic?${replyNote}`)) {
      onDelete(topic.id);
    }
  };

  return (
    <article
      data-unread={hasUnread ? "true" : undefined}
      className={`rounded-lg border p-4 shadow-sm ${
        isRegenerating
          ? "border-slate-200 bg-amber-50"
          : hasUnread
            ? topic.hiddenFromContext
              ? "border-dashed border-sky-300 bg-sky-50"
              : "border-sky-200 bg-sky-50"
            : topic.hiddenFromContext
              ? "border-dashed border-slate-300 bg-slate-50"
              : "border-slate-200 bg-white"
      }`}
    >
      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{variant.subject}</h2>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">@{variant.username}</span>
            {" · "}
            {variant.source === "human" ? "human" : "simulated"}
            {" · "}
            {new Date(variant.createdAt).toLocaleString()}
            {topic.hiddenFromContext && (
              <>
                {" · "}
                <span className="font-medium text-amber-800">Hidden from context</span>
              </>
            )}
          </p>
        </div>
        {replyCount > 0 && (
          <button
            type="button"
            onClick={() => onToggle(topic.id)}
            className={`rounded border px-2 py-1 text-xs ${
              hasUnread
                ? "border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-200"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isCollapsed ? `▶ Show ${replyCount} replies` : "▼ Hide replies"}
          </button>
        )}
      </header>

      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
        {variant.content}
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SwipeControls
          activeIndex={topic.activeVariant}
          total={topic.variants.length}
          onPrev={() => onSwipe(topic.id, -1)}
          onNext={() => onSwipe(topic.id, 1)}
          onRegenerate={() => onRegenerate(topic.id)}
          regenerating={isRegenerating}
        />
        <button
          type="button"
          onClick={() => onSimulateReply(topic.id, null)}
          className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
        >
          Simulate Reply
        </button>
        <button
          type="button"
          onClick={() => onHumanReply(topic.id, null)}
          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
        >
          Reply
        </button>
        <button
          type="button"
          aria-pressed={topic.hiddenFromContext}
          title="Exclude this thread from the board context used when generating replies"
          onClick={() => onToggleHiddenFromContext(topic.id)}
          className={`rounded border px-2 py-1 text-xs ${
            topic.hiddenFromContext
              ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          Hide from Context
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
        >
          Delete
        </button>
      </div>

      {!isCollapsed && topic.replies.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          {topic.replies.map((reply) => (
            <ReplyNodeView
              key={reply.id}
              reply={reply}
              topicId={topic.id}
              depth={0}
              collapsed={collapsed}
              unread={unread}
              regeneratingNodeId={regeneratingNodeId}
              onToggle={onToggle}
              onSimulateReply={onSimulateReply}
              onHumanReply={onHumanReply}
              onDelete={onDeleteReply}
              onSwipe={onSwipeReply}
              onRegenerate={onRegenerateReply}
            />
          ))}
        </div>
      )}
    </article>
  );
}
