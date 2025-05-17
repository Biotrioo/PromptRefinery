'use client';
import React, { useState, useEffect } from "react";
import { usePromptStore, AIProvider } from "../store/promptStore";

const tags = ["All", "Dev", "Creative", "Agent", "Marketing"];

export default function Sidebar() {
  const activeTag = usePromptStore((s) => s.activeTag);
  const setActiveTag = usePromptStore((s) => s.setActiveTag);
  const [showSettings, setShowSettings] = useState(false);
  console.log("showSettings", showSettings);

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-4 min-h-screen">
      <h2 className="text-lg font-bold mb-4 tracking-wide">PromptRefinery</h2>
      <nav className="flex-1">
        <div className="mb-2 text-xs text-gray-400 uppercase tracking-wider">Tags</div>
        <ul className="space-y-2">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                className={`w-full text-left px-2 py-1 rounded transition-colors ${activeTag === tag ? "bg-blue-700 text-white" : "hover:bg-gray-800"}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto text-xs text-gray-500 flex flex-col gap-2">
        <button
          className="w-full text-left px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
          onClick={() => setShowSettings(true)}
        >
          ⚙️ Settings
        </button>
        <span>Dark Mode • v5</span>
      </div>
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </aside>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const providerSettings = usePromptStore((s) => s.providerSettings);
  const setProviderSettings = usePromptStore((s) => s.setProviderSettings);
  const [lmModels, setLmModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState("");
  const [formError, setFormError] = useState("");
  const isLmStudio = providerSettings.provider === 'lmstudio';
  const lmStudioOnline = isLmStudio && !loadingModels && !modelError && lmModels.length > 0;

  useEffect(() => {
    if (!isLmStudio) return;
    setLoadingModels(true);
    setModelError("");
    fetch(providerSettings.endpoint.replace(/\/v1\/chat\/completions$/, "/v1/models"))
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = (await res.json()) as unknown as { data?: { id: string; ready?: boolean }[] };
        const loadedModels = (data.data || []).filter((m) => m.ready);
        setLmModels(loadedModels.map((m) => m.id));
      })
      .catch(() => {
        setModelError("Could not fetch models from LM Studio. Is it running?");
        setLmModels([]);
      })
      .finally(() => setLoadingModels(false));
  }, [isLmStudio, providerSettings.endpoint]);

  useEffect(() => {
    if (providerSettings.provider === 'lmstudio') {
      if (
        !providerSettings.endpoint ||
        providerSettings.endpoint === 'https://openrouter.ai/api/v1/chat/completions'
      ) {
        setProviderSettings({ endpoint: 'http://127.0.0.1:1234/v1/chat/completions' });
      }
    }
  }, [providerSettings.provider]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (isLmStudio && !providerSettings.model) {
      setFormError("Please select a model for LM Studio.");
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded p-6 w-96 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
          onClick={onClose}
        >
          ×
        </button>
        <h3 className="text-lg font-semibold mb-4">AI Provider Settings</h3>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-1 text-sm">
            Provider
            <select
              className="bg-gray-800 border border-gray-700 rounded p-2 text-gray-100"
              value={providerSettings.provider}
              onChange={e => setProviderSettings({ provider: e.target.value as AIProvider })}
            >
              <option value="openrouter">OpenRouter</option>
              <option value="lmstudio">LM Studio (local)</option>
            </select>
          </label>
          {providerSettings.provider === 'openrouter' && (
            <label className="flex flex-col gap-1 text-sm">
              OpenRouter API Key
              <input
                className="bg-gray-800 border border-gray-700 rounded p-2 text-gray-100"
                type="password"
                value={providerSettings.apiKey}
                onChange={e => setProviderSettings({ apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            Endpoint
            <input
              className="bg-gray-800 border border-gray-700 rounded p-2 text-gray-100"
              type="text"
              value={providerSettings.endpoint}
              onChange={e => setProviderSettings({ endpoint: e.target.value })}
              placeholder={providerSettings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : 'http://127.0.0.1:1234/v1/chat/completions'}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Model
            {providerSettings.provider === 'lmstudio' ? (
              loadingModels ? (
                <div className="text-xs text-gray-400">Loading models...</div>
              ) : modelError ? (
                <div className="text-xs text-red-400">{modelError}</div>
              ) : lmModels.length === 0 ? (
                <div className="text-xs text-yellow-400">No models loaded in LM Studio. Please load a model to use it here.</div>
              ) : (
                <select
                  className="bg-gray-800 border border-gray-700 rounded p-2 text-gray-100"
                  value={providerSettings.model}
                  onChange={e => setProviderSettings({ model: e.target.value })}
                >
                  <option value="">Select a model</option>
                  {lmModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )
            ) : (
              <input
                className="bg-gray-800 border border-gray-700 rounded p-2 text-gray-100"
                type="text"
                value={providerSettings.model}
                onChange={e => setProviderSettings({ model: e.target.value })}
                placeholder="openai/gpt-3.5-turbo"
              />
            )}
          </label>
          {isLmStudio && (
            <div className="text-xs text-gray-400 flex items-center gap-2">
              LM Studio must be running locally at <code className="bg-gray-800 px-1">http://127.0.0.1:1234</code>.
              <span className={lmStudioOnline ? "text-green-400" : "text-red-400"}>
                {lmStudioOnline ? "Online" : "Offline"}
              </span>
              <br />
              Models are fetched from <code className="bg-gray-800 px-1">http://127.0.0.1:1234/v1/models</code>.
            </div>
          )}
          {formError && <div className="text-xs text-red-400">{formError}</div>}
          <button
            type="submit"
            className="mt-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
} 