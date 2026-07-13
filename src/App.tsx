import { Board } from "./components/Board";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { SettingsPanel } from "./components/SettingsPanel";
import { useBoardStore } from "./hooks/useBoardStore";

export function App() {
  const { error, clearError, loading } = useBoardStore();

  return (
    <div className="min-h-screen bg-slate-100">
      <LoadingOverlay active={loading} />
      <div className="mx-auto flex min-h-screen max-w-7xl gap-4 p-4">
        <div className="w-full max-w-sm shrink-0">
          <SettingsPanel />
        </div>
        <main className="min-w-0 flex-1 space-y-4">
          {error && <ErrorBanner message={error} onDismiss={clearError} />}
          <Board />
        </main>
      </div>
    </div>
  );
}
