'use client';
import React from "react";
import { usePromptStore } from "../store/promptStore";

export default function VersionHistory({ promptId }: { promptId: number }) {
  const prompts = usePromptStore((s) => s.prompts);
  const revertPromptVersion = usePromptStore((s) => s.revertPromptVersion);
  const prompt = prompts.find((p) => p.id === promptId);
  if (!prompt || !prompt.versions || prompt.versions.length === 0) return null;
  return (
    <div className="mt-6">
      <h4 className="text-xs font-semibold mb-2 text-gray-400">Version History</h4>
      <ul className="space-y-2">
        {prompt.versions.map((v, i) => (
          <li key={i} className="bg-gray-800 rounded p-2 flex items-center justify-between text-xs">
            <div>
              <div className="font-mono text-gray-300 truncate">{v.content.slice(0, 40)}{v.content.length > 40 ? '...' : ''}</div>
              <div className="text-gray-500">{new Date(v.timestamp).toISOString().replace('T', ' ').slice(0, 16)}</div>
            </div>
            <button
              className="ml-2 px-2 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white"
              onClick={() => revertPromptVersion(promptId, i)}
            >
              Revert
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 