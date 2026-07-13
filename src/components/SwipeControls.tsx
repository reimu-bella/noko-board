interface SwipeControlsProps {
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onRegenerate: () => void;
  regenerating?: boolean;
}

export function SwipeControls({
  activeIndex,
  total,
  onPrev,
  onNext,
  onRegenerate,
  regenerating = false,
}: SwipeControlsProps) {
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < total - 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {total > 1 && (
        <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="px-1.5 py-0.5 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-30"
            aria-label="Previous version"
          >
            ◀
          </button>
          <span className="min-w-[3rem] text-center text-xs text-slate-500">
            {activeIndex + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="px-1.5 py-0.5 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-30"
            aria-label="Next version"
          >
            ▶
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onRegenerate}
        disabled={regenerating}
        className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {regenerating ? "Regenerating…" : "Regenerate"}
      </button>
    </div>
  );
}
