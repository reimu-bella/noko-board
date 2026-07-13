interface LoadingOverlayProps {
  active: boolean;
  label?: string;
}

export function LoadingOverlay({
  active,
  label = "Generating…",
}: LoadingOverlayProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
        <p className="text-sm font-medium text-slate-700">{label}</p>
      </div>
    </div>
  );
}
