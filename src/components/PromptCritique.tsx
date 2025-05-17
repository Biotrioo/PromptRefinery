'use client';
import React, { useState } from "react";
import { usePromptStore } from "../store/promptStore";

export default function PromptCritique() {
  const selectedPromptId = usePromptStore((s) => s.selectedPromptId);
  const prompts = usePromptStore((s) => s.prompts);
  const providerSettings = usePromptStore((s) => s.providerSettings);
  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || null;

  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [improved, setImproved] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCritique = async () => {
    if (!selectedPrompt) return;
    if (!providerSettings || !providerSettings.provider || !providerSettings.model || !providerSettings.endpoint || (providerSettings.provider === 'openrouter' && !providerSettings.apiKey)) {
      setError("Please configure your AI provider settings first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: selectedPrompt.content, providerSettings }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to critique");
      setWeaknesses(data.weaknesses);
      setImproved(data.improved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error critiquing prompt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-md font-semibold mb-4">Critique & Improvement</h3>
      <button
        className="mb-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleCritique}
        disabled={!selectedPrompt || loading}
      >
        {loading ? "Critiquing..." : "Critique & Improve"}
      </button>
      {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
      <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-800">
        <div className="font-bold text-sm mb-1 text-yellow-400">Weaknesses</div>
        <ul className="list-disc list-inside text-xs text-gray-300">
          {(weaknesses.length > 0 ? weaknesses : ["No critique yet."]).map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>
      <div className="p-3 bg-gray-900 rounded border border-gray-800">
        <div className="font-bold text-sm mb-1 text-green-400">Improved Prompt</div>
        <div className="text-xs text-gray-300 whitespace-pre-line">{improved || "No improved prompt yet."}</div>
      </div>
    </div>
  );
} 