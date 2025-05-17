'use client';
import React, { useRef, useState } from "react";
import { usePromptStore } from "../store/promptStore";
import type { Prompt } from "../store/promptStore";

export default function PromptVault() {
  const prompts = usePromptStore((s) => s.prompts);
  const setPrompts = usePromptStore.setState;
  const activeTag = usePromptStore((s) => s.activeTag);
  const setActiveTag = usePromptStore((s) => s.setActiveTag);
  const searchQuery = usePromptStore((s) => s.searchQuery);
  const setSearchQuery = usePromptStore((s) => s.setSearchQuery);
  const selectedPromptId = usePromptStore((s) => s.selectedPromptId);
  const setSelectedPrompt = usePromptStore((s) => s.setSelectedPrompt);
  const deletePrompt = usePromptStore((s) => s.deletePrompt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  // For future: duplicatePrompt

  // Extract all unique tags from prompts (reactively)
  const allTags = Array.from(new Set(prompts.flatMap(p => p.tags)));

  // Filter prompts by activeTag and searchQuery
  const filteredPrompts = prompts.filter(p => {
    const matchesTag = activeTag === 'All' || p.tags.includes(activeTag);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.tags.some(tag => tag.toLowerCase().includes(q)) ||
      p.content.toLowerCase().includes(q);
    return matchesTag && matchesSearch;
  });

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Delete prompt "${title}"? This cannot be undone.`)) {
      deletePrompt(id);
    }
  };

  // For future: handleDuplicate

  // Export vault as JSON
  const handleExport = () => {
    const data = JSON.stringify(prompts, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage("Vault exported. Move the file to a safe location for permanent backup.");
  };

  // Import vault from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) throw new Error("Invalid file format");
        // Basic validation: check for id, title, content
        if (!(imported as Prompt[]).every((p) => p.id && p.title && p.content)) throw new Error("Invalid prompt data");
        // Ask user: Overwrite or Merge
        const action = window.prompt(
          "Import prompts: Type 'overwrite' to replace your vault, or 'merge' to add new prompts (skipping duplicates by id). Type anything else to cancel.",
          "merge"
        );
        if (action !== "overwrite" && action !== "merge") {
          setMessage("Import cancelled.");
          return;
        }
        if (action === "overwrite") {
          setPrompts((state: { prompts: Prompt[] }) => ({ ...state, prompts: imported as Prompt[] }));
          setMessage("Vault imported (overwritten) successfully.");
        } else if (action === "merge") {
          setPrompts((state: { prompts: Prompt[] }) => {
            const existingIds = new Set(state.prompts.map((p) => p.id));
            const merged = [
              ...state.prompts,
              ...(imported as Prompt[]).filter((p) => !existingIds.has(p.id)),
            ];
            return { ...state, prompts: merged };
          });
          setMessage("Vault imported (merged) successfully. Only new prompts were added.");
        }
      } catch (err) {
        setMessage("Import failed: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-md font-semibold mb-4">Prompt Vault</h3>
      <div className="flex gap-2 mb-4">
        <button
          className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs"
          onClick={handleExport}
        >
          Export Vault
        </button>
        <button
          className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          Import Vault
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
      {message && <div className="text-green-400 text-xs mb-2">{message}</div>}
      {/* Tag Bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded text-xs border ${activeTag === 'All' ? 'bg-blue-700 text-white border-blue-700' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
            onClick={() => setActiveTag('All')}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`px-3 py-1 rounded text-xs border ${activeTag === tag ? 'bg-blue-700 text-white border-blue-700' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <input
        className="w-full mb-4 p-2 rounded bg-gray-900 border border-gray-800 text-gray-100"
        placeholder="Search prompts..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <span className="text-2xl mb-2">🔍</span>
            <span className="text-sm">No prompts found. Try a different tag or search.</span>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredPrompts.map((prompt) => (
              <li
                key={prompt.id}
                className={`transition-colors cursor-pointer flex items-start gap-2 rounded-lg border p-4 shadow-sm ${selectedPromptId === prompt.id ? "border-blue-600 bg-blue-950/40 ring-2 ring-blue-600" : "border-gray-800 bg-gray-900 hover:bg-gray-800"}`}
                onClick={() => setSelectedPrompt(prompt.id)}
                tabIndex={0}
                aria-selected={selectedPromptId === prompt.id}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base mb-1 truncate">{prompt.title}</div>
                  <div className="flex gap-2 mb-1 flex-wrap">
                    {prompt.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">{tag}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 truncate max-w-full overflow-hidden">{prompt.content.slice(0, 80)}{prompt.content.length > 80 ? '...' : ''}</div>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    className="text-blue-500 hover:text-blue-700 p-1 rounded"
                    title="Edit prompt"
                    onClick={e => { e.stopPropagation(); setSelectedPrompt(prompt.id); }}
                  >
                    <span role="img" aria-label="Edit">✏️</span>
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 p-1 rounded"
                    title="Delete prompt"
                    onClick={e => { e.stopPropagation(); handleDelete(prompt.id, prompt.title); }}
                  >
                    <span role="img" aria-label="Delete">🗑️</span>
                  </button>
                  <button
                    className="text-gray-400 hover:text-gray-200 p-1 rounded"
                    title="Duplicate prompt"
                    disabled
                  >
                    <span role="img" aria-label="Duplicate">📄</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 