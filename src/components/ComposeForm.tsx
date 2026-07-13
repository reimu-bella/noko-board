import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "../hooks/useBoardStore";
import type { ReplyTarget } from "../types/board";

export function ComposeForm() {
  const { addHumanTopic, addHumanReply } = useBoardStore();
  const [mode, setMode] = useState<"topic" | "reply">("topic");
  const [username, setUsername] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ReplyTarget>).detail;
      setMode("reply");
      setReplyTarget(detail);
      usernameRef.current?.focus();
    };
    window.addEventListener("noko:focus-compose", handler);
    return () => window.removeEventListener("noko:focus-compose", handler);
  }, []);

  const resetReply = () => {
    setMode("topic");
    setReplyTarget(null);
    setSubject("");
    setContent("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !content.trim()) return;

    if (mode === "reply" && replyTarget) {
      addHumanReply(replyTarget, username, content);
      setContent("");
      return;
    }

    if (!subject.trim()) return;
    addHumanTopic(username, subject, content);
    setSubject("");
    setContent("");
  };

  return (
    <section className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Human Post</h3>
        {mode === "reply" && (
          <button
            type="button"
            onClick={resetReply}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            New topic instead
          </button>
        )}
      </div>

      {mode === "reply" && (
        <p className="text-xs text-slate-500">Replying to a thread</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-xs text-slate-600">
          Username
          <input
            ref={usernameRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your display name"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>

        {mode === "topic" && (
          <label className="block text-xs text-slate-600">
            Subject
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Topic subject"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
        )}

        <label className="block text-xs text-slate-600">
          Content
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Write your post…"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {mode === "reply" ? "Post Reply" : "Post Topic"}
        </button>
      </form>
    </section>
  );
}
