import { create } from "zustand";

const STORAGE_KEY = "last-model";

export const GEMINI_CHAT_MODEL = "gemini-3.1-flash-lite";

export function isGeminiChatModel(model: string): boolean {
  return model === GEMINI_CHAT_MODEL;
}

function readStoredModel(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}

interface ModelStore {
  lastModel: string | null;
  setLastModel: (model: string | null) => void;
}

export function getDefaultModel<T extends { name: string }>(
  models: T[] = [],
): string | null {
  if (!models.length) return null;

  const names = models
    .map((model) => model.name)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0,
    );

  const geminiModel = names.find((name) =>
    name.toLowerCase().includes("gemini"),
  );
  if (geminiModel) return geminiModel;

  const gemmaModel = names.find((name) => name.toLowerCase().includes("gemma"));
  if (gemmaModel) return gemmaModel;

  return names[0] ?? null;
}

export const useModelStore = create<ModelStore>((set) => ({
  lastModel: null,
  setLastModel: (model) => {
    if (typeof window !== "undefined") {
      if (model) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    set({ lastModel: model });
  },
}));

export function getStoredModel(): string | null {
  return readStoredModel();
}
