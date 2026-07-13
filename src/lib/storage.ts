import { createInitialState, type BoardState } from "../types/board";
import { migrateTopics } from "./migrate";

const STORAGE_KEY = "noko-board-state-v1";

export function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as {
      topics?: unknown[];
      settings?: BoardState["settings"];
    };
    if (!parsed.topics || !parsed.settings) return createInitialState();
    return {
      topics: migrateTopics(parsed.topics as Parameters<typeof migrateTopics>[0]),
      settings: {
        ...createInitialState().settings,
        ...parsed.settings,
        knownUsernames: parsed.settings.knownUsernames ?? [],
      },
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: BoardState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state: BoardState): void {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `noko-board-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseImportedState(raw: string): BoardState {
  const parsed = JSON.parse(raw) as {
    topics?: unknown[];
    settings?: BoardState["settings"];
  };
  if (!Array.isArray(parsed.topics) || typeof parsed.settings !== "object") {
    throw new Error("Invalid board file: missing topics or settings.");
  }
  return {
    topics: migrateTopics(parsed.topics as Parameters<typeof migrateTopics>[0]),
    settings: {
      ...createInitialState().settings,
      ...parsed.settings,
      knownUsernames: parsed.settings.knownUsernames ?? [],
    },
  };
}
