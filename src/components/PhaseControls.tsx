import { useState } from "react";
import { useBoardStore } from "../hooks/useBoardStore";

export function PhaseControls() {
  const { phase, loading, initializeBoard, generateBoard } = useBoardStore();
  const [topicCount, setTopicCount] = useState(5);
  const [newTopics, setNewTopics] = useState(2);
  const [newReplies, setNewReplies] = useState(4);

  if (phase === "initial") {
    return (
      <section className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-800">Initialize Board</h3>
        <label className="block text-xs text-slate-600">
          Number of topics
          <input
            type="number"
            min={1}
            max={20}
            value={topicCount}
            onChange={(e) => setTopicCount(Math.max(1, Number(e.target.value)))}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => initializeBoard(topicCount)}
          className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Initialize Board
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-800">Generate</h3>
      <label className="block text-xs text-slate-600">
        New topics
        <input
          type="number"
          min={0}
          max={10}
          value={newTopics}
          onChange={(e) => setNewTopics(Math.max(0, Number(e.target.value)))}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="block text-xs text-slate-600">
        New replies
        <input
          type="number"
          min={0}
          max={20}
          value={newReplies}
          onChange={(e) => setNewReplies(Math.max(0, Number(e.target.value)))}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={loading || (newTopics === 0 && newReplies === 0)}
        onClick={() => generateBoard(newTopics, newReplies)}
        className="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Generate
      </button>
    </section>
  );
}
