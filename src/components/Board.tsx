import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "../hooks/useBoardStore";
import { collectReplyIds } from "../lib/parser";
import { collapsedAncestorIds } from "../lib/tree";
import type { ReplyTarget } from "../types/board";
import { TopicCard } from "./TopicCard";

export function Board() {
  const {
    state,
    simulateReply,
    deleteTopic,
    deleteReply,
    swipeTopic,
    swipeReply,
    regenerateNode,
    regeneratingNodeId,
    toggleHiddenFromContext,
  } = useBoardStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [unread, setUnread] = useState<Record<string, boolean>>({});
  const knownReplyIds = useRef<Set<string> | null>(null);
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;

  useEffect(() => {
    const currentIds = collectReplyIds(state.topics);
    const previous = knownReplyIds.current;
    knownReplyIds.current = currentIds;
    if (!previous) return;

    const collapsedNow = collapsedRef.current;
    const ancestorIds = new Set<string>();
    for (const id of currentIds) {
      if (previous.has(id)) continue;
      for (const ancestorId of collapsedAncestorIds(
        state.topics,
        id,
        (nodeId) => !!collapsedNow[nodeId],
      )) {
        ancestorIds.add(ancestorId);
      }
    }
    if (ancestorIds.size === 0) return;

    setUnread((prev) => {
      const next = { ...prev };
      for (const id of ancestorIds) next[id] = true;
      return next;
    });
  }, [state.topics]);

  const toggleCollapsed = (id: string) => {
    const expanding = !!collapsed[id];
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!expanding) return;
    setUnread((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleHumanReply = (topicId: string, parentReplyId: string | null) => {
    window.dispatchEvent(
      new CustomEvent<ReplyTarget>("noko:focus-compose", {
        detail: { topicId, parentReplyId },
      }),
    );
  };

  if (state.topics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <div>
          <h2 className="text-lg font-medium text-slate-700">No topics yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Set your global context and click Initialize Board to populate the
            simulator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.topics.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          collapsed={collapsed}
          unread={unread}
          regeneratingNodeId={regeneratingNodeId}
          onToggle={toggleCollapsed}
          onSimulateReply={simulateReply}
          onHumanReply={handleHumanReply}
          onDelete={deleteTopic}
          onDeleteReply={deleteReply}
          onSwipe={swipeTopic}
          onSwipeReply={swipeReply}
          onRegenerate={(topicId) => void regenerateNode({ kind: "topic", topicId })}
          onRegenerateReply={(topicId, replyId) =>
            void regenerateNode({ kind: "reply", topicId, replyId })
          }
          onToggleHiddenFromContext={toggleHiddenFromContext}
        />
      ))}
    </div>
  );
}
