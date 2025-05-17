import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getIndexedDbStorage } from '../utils/indexedDbStorage';

export interface PromptVersion {
  title: string;
  tags: string[];
  content: string;
  timestamp: number;
}

export interface TestSnapshot {
  prompt: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  systemPrompt: string;
  output: string;
  rating: number;
  notes: string;
  timestamp: number;
}

export interface Prompt {
  id: number;
  title: string;
  tags: string[];
  content: string;
  versions?: PromptVersion[];
  testSnapshots?: TestSnapshot[];
  created: number;
  lastEdited: number;
}

export type AIProvider = 'openrouter' | 'lmstudio';

interface ProviderSettings {
  provider: AIProvider;
  apiKey: string;
  endpoint: string;
  model: string;
}

interface PromptState {
  prompts: Prompt[];
  selectedPromptId: number | null;
  activeTag: string;
  searchQuery: string;
  providerSettings: ProviderSettings;
  setProviderSettings: (settings: Partial<ProviderSettings>) => void;
  setSearchQuery: (query: string) => void;
  addPrompt: (prompt: Omit<Prompt, "id" | "versions" | "testSnapshots" | "created" | "lastEdited">) => number;
  getPrompts: () => Prompt[];
  setSelectedPrompt: (id: number | null) => void;
  setActiveTag: (tag: string) => void;
  updatePrompt: (id: number, data: Partial<Omit<Prompt, "id" | "versions" | "testSnapshots" | "created" | "lastEdited">>) => void;
  deletePrompt: (id: number) => void;
  revertPromptVersion: (id: number, versionIdx: number) => void;
  addTestSnapshot: (id: number, snapshot: TestSnapshot) => void;
}

let idCounter = 3;

const STORE_KEY = 'prompt-refinery-store';

// Helper: localStorage adapter for SSR and fallback
const localStorageAdapter = {
  getItem: (name: string) =>
    Promise.resolve(
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem(name) || 'null')
        : null
    ),
  setItem: (name: string, value: any) =>
    Promise.resolve(
      typeof window !== 'undefined'
        ? localStorage.setItem(name, JSON.stringify(value))
        : undefined
    ),
  removeItem: (name: string) =>
    Promise.resolve(
      typeof window !== 'undefined'
        ? localStorage.removeItem(name)
        : undefined
    ),
};

// Zustand persist config: use localStorage for SSR, switch to IndexedDB after hydration
export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: [
        { id: 1, title: "Summarize Article", tags: ["Dev", "Agent"], content: "Summarize the following article...", created: Date.now(), lastEdited: Date.now() },
        { id: 2, title: "Creative Story", tags: ["Creative"], content: "Write a story about...", created: Date.now(), lastEdited: Date.now() },
      ],
      selectedPromptId: null,
      activeTag: "All",
      searchQuery: "",
      providerSettings: {
        provider: 'openrouter',
        apiKey: '',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-3.5-turbo',
      },
      addPrompt: (prompt) => {
        console.log("Adding prompt:", prompt);
        const newId = idCounter++;
        const now = Date.now();
        set((state) => ({
          prompts: [
            ...state.prompts,
            { ...prompt, id: newId, versions: [], testSnapshots: [], created: now, lastEdited: now },
          ],
        }));
        return newId;
      },
      getPrompts: () => {
        const { prompts, activeTag, searchQuery } = get();
        let filtered = prompts;
        if (activeTag !== "All") {
          filtered = filtered.filter((p) => p.tags.includes(activeTag));
        }
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
              p.content.toLowerCase().includes(q)
          );
        }
        return filtered;
      },
      setSelectedPrompt: (id) => set({ selectedPromptId: id }),
      setActiveTag: (tag) => set({ activeTag: tag }),
      updatePrompt: (id, data) =>
        set((state) => ({
          prompts: state.prompts.map((p) => {
            if (p.id !== id) return p;
            const prevVersion = {
              title: p.title,
              tags: p.tags,
              content: p.content,
              timestamp: Date.now(),
            };
            return {
              ...p,
              ...data,
              lastEdited: Date.now(),
              versions: [prevVersion, ...(p.versions || [])],
            };
          }),
        })),
      deletePrompt: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          selectedPromptId: state.selectedPromptId === id ? null : state.selectedPromptId,
        })),
      revertPromptVersion: (id, versionIdx) =>
        set((state) => ({
          prompts: state.prompts.map((p) => {
            if (p.id !== id || !p.versions || !p.versions[versionIdx]) return p;
            const v = p.versions[versionIdx];
            const newVersion = {
              title: p.title,
              tags: p.tags,
              content: p.content,
              timestamp: Date.now(),
            };
            return {
              ...p,
              title: v.title,
              tags: v.tags,
              content: v.content,
              versions: [newVersion, ...p.versions.slice(0, versionIdx), ...p.versions.slice(versionIdx + 1)],
            };
          }),
        })),
      setProviderSettings: (settings) =>
        set((state) => ({
          providerSettings: { ...state.providerSettings, ...settings },
        })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      addTestSnapshot: (id, snapshot) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id
              ? { ...p, testSnapshots: [snapshot, ...(p.testSnapshots || [])] }
              : p
          ),
        })),
    }),
    {
      name: STORE_KEY,
      storage: localStorageAdapter, // Always safe for SSR
      // Persist the full state for compatibility
      // Remove partialize for now to avoid type errors
    }
  )
);

// Client-side: after hydration, migrate to IndexedDB and update Zustand's storage
export async function migrateToIndexedDBIfPossible() {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;
  const idbStorage = await getIndexedDbStorage();
  if (!idbStorage) return;
  // Check if IndexedDB already has data
  const idbValue = await idbStorage.getItem(STORE_KEY);
  if (!idbValue) {
    // Migrate from localStorage if needed
    const localValue = localStorage.getItem(STORE_KEY);
    if (localValue) {
      await idbStorage.setItem(STORE_KEY, JSON.parse(localValue));
      localStorage.removeItem(STORE_KEY);
      // Optionally notify user
      console.log('Migrated PromptRefinery store from localStorage to IndexedDB.');
    }
  }
  // Dynamically update Zustand's storage to use IndexedDB (advanced, not natively supported by Zustand)
  // For now, future reloads will use IndexedDB if you change the persist config to use idbStorage
  // (Zustand does not support hot-swapping storage at runtime)
} 