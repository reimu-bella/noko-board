import { useRef } from "react";
import { useBoardStore } from "../hooks/useBoardStore";
import { exportState, parseImportedState } from "../lib/storage";
import { AVAILABLE_MODELS } from "../types/board";
import { ComposeForm } from "./ComposeForm";
import { PhaseControls } from "./PhaseControls";

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs text-slate-600">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function SettingsPanel() {
  const { state, setSettings, loadState, clearBoard } = useBoardStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const { settings } = state;

  const handleImport = async (file: File) => {
    const text = await file.text();
    const imported = parseImportedState(text);
    loadState(imported);
  };

  return (
    <aside className="flex h-full flex-col gap-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Noko Board</h1>
        <p className="text-xs text-slate-500">Message board simulator</p>
      </div>

      <FieldLabel label="API Key">
        <input
          type="password"
          value={settings.apiKey}
          onChange={(e) => setSettings({ apiKey: e.target.value })}
          placeholder="sk_… from enter.pollinations.ai"
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </FieldLabel>

      <FieldLabel label="Model">
        <select
          value={settings.model}
          onChange={(e) => setSettings({ model: e.target.value })}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        >
          {AVAILABLE_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </FieldLabel>

      <FieldLabel label="Global Context">
        <textarea
          value={settings.globalContext}
          onChange={(e) => setSettings({ globalContext: e.target.value })}
          rows={5}
          placeholder="e.g. Paste a short story, fandom premise, or scenario…"
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </FieldLabel>

      <FieldLabel label="Pre-Context Instructions">
        <textarea
          value={settings.preContextInstructions}
          onChange={(e) =>
            setSettings({ preContextInstructions: e.target.value })
          }
          rows={4}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </FieldLabel>

      <FieldLabel label="Post-Context Instructions">
        <textarea
          value={settings.postContextInstructions}
          onChange={(e) =>
            setSettings({ postContextInstructions: e.target.value })
          }
          rows={3}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </FieldLabel>

      <PhaseControls />
      <ComposeForm />

      <section className="space-y-2 border-t border-slate-200 pt-3">
        <h3 className="text-sm font-semibold text-slate-800">Board Data</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportState(state)}
            className="flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-slate-50"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs hover:bg-slate-50"
          >
            Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Clear all topics from the board?")) {
              clearBoard();
            }
          }}
          className="w-full rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 hover:bg-red-100"
        >
          Clear Board
        </button>
      </section>
    </aside>
  );
}
