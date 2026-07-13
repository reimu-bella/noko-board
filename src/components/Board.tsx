import { useState } from "react";
import { useBoardStore } from "../hooks/useBoardStore";
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
  } = useBoardStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
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
        />
      ))}
    </div>
  );
}
