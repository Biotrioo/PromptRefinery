import React, { useEffect, useRef, useState } from "react";
import { Prompt } from "../store/promptStore";
import ReactMarkdown from "react-markdown";
import { usePromptStore } from "../store/promptStore";

interface PromptPreviewPanelProps {
  open: boolean;
  prompt: Prompt | null;
  onClose: () => void;
  onEdit: () => void;
}

export default function PromptPreviewPanel({ open, prompt, onClose, onEdit }: PromptPreviewPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Critique & Improve state
  const providerSettings = usePromptStore(s => s.providerSettings);
  const addPrompt = usePromptStore(s => s.addPrompt);
  const updatePrompt = usePromptStore(s => s.updatePrompt);
  const setSelectedPrompt = usePromptStore(s => s.setSelectedPrompt);
  const [critiqueLoading, setCritiqueLoading] = useState(false);
  const [critiqueError, setCritiqueError] = useState('');
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [improved, setImproved] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  // Focus trap and Esc key handling
  useEffect(() => {
    if (!open) return;
    // Focus the first button when panel opens
    firstButtonRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    // Announce panel open
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = prompt ? `Previewing prompt: ${prompt.title}` : '';
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Announce panel close
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = 'Prompt preview closed';
      }
    };
  }, [open, onClose, prompt]);

  if (!open || !prompt) return null;

  // Critique handler
  const handleCritique = async () => {
    if (!providerSettings || !providerSettings.provider) {
      setCritiqueError('Please configure your AI provider settings.');
      return;
    }
    setCritiqueLoading(true);
    setCritiqueError('');
    setWeaknesses([]);
    setImproved('');
    setSaveMsg('');
    try {
      const res = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.content, providerSettings }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to critique');
      setWeaknesses(data.weaknesses);
      setImproved(data.improved);
    } catch (e) {
      setCritiqueError(e instanceof Error ? e.message : 'Error critiquing prompt');
    } finally {
      setCritiqueLoading(false);
    }
  };

  // Save as new version
  const handleSaveAsVersion = () => {
    if (!improved) return;
    updatePrompt(prompt.id, { content: improved });
    setSaveMsg('Saved as new version!');
  };
  // Save as new prompt
  const handleSaveAsNewPrompt = () => {
    if (!improved) return;
    const newId = addPrompt({
      title: prompt.title + ' (Improved)',
      tags: prompt.tags,
      content: improved,
    });
    setSelectedPrompt(newId);
    setSaveMsg('Saved as new prompt!');
  };

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-preview-title"
      className={`fixed right-0 top-0 h-full w-[32rem] bg-gray-950 shadow-xl border-l border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Screen reader live region */}
      <div ref={liveRegionRef} aria-live="polite" className="sr-only" />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 id="prompt-preview-title" className="text-xl font-bold truncate">{prompt.title}</h2>
        <div className="flex gap-2">
          <button ref={firstButtonRef} onClick={onEdit} className="text-blue-500 hover:text-blue-700 p-1 rounded" aria-label="Edit Prompt">✏️</button>
          <button ref={lastButtonRef} onClick={onClose} className="text-gray-400 hover:text-gray-200 p-1 rounded" aria-label="Close Preview">✖️</button>
        </div>
      </div>
      {/* Tags */}
      <div className="flex flex-wrap gap-2 p-4">
        {prompt.tags.map(tag => (
          <span key={tag} className="bg-gray-800 text-xs px-2 py-0.5 rounded text-gray-300">{tag}</span>
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({children, ...props}) {
                // @ts-expect-error: react-markdown type issue for inline
                const isInline = props.inline;
                return isInline ? (
                  <code className="bg-gray-800 text-pink-400 px-1 rounded text-xs" {...props}>{children}</code>
                ) : (
                  <pre className="bg-gray-900 rounded p-3 overflow-x-auto text-xs mb-2"><code {...props}>{children}</code></pre>
                );
              }
            }}
          >
            {prompt.content}
          </ReactMarkdown>
        </div>
        {/* Critique & Improve Section */}
        <div className="mt-8">
          <button
            onClick={handleCritique}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={critiqueLoading}
            aria-label="Critique & Improve"
          >
            {critiqueLoading ? (
              <span>
                <span className="animate-spin inline-block mr-2">🔄</span> Critiquing...
              </span>
            ) : (
              'Critique & Improve'
            )}
          </button>
          {critiqueError && <div className="text-red-400 text-xs mt-2" role="alert">{critiqueError}</div>}
          {weaknesses.length > 0 && (
            <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-800">
              <div className="font-bold text-sm mb-1 text-yellow-400">Weaknesses</div>
              <ul className="list-disc list-inside text-xs text-gray-300">
                {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {improved && (
            <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-800">
              <div className="font-bold text-sm mb-1 text-green-400">Improved Prompt</div>
              <div className="text-xs text-gray-300 whitespace-pre-line mb-2">
                <ReactMarkdown>{improved}</ReactMarkdown>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveAsVersion}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs"
                  aria-label="Save as New Version"
                >
                  Save as New Version
                </button>
                <button
                  onClick={handleSaveAsNewPrompt}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded text-xs"
                  aria-label="Save as New Prompt"
                >
                  Save as New Prompt
                </button>
              </div>
              {saveMsg && <div className="text-green-400 text-xs mt-2" role="status">{saveMsg}</div>}
            </div>
          )}
        </div>
      </div>
      {/* Metadata */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
        <div>Last edited: <span className="text-gray-300">{prompt.lastEdited ? new Date(prompt.lastEdited).toLocaleString() : 'N/A'}</span></div>
        <div>Created: <span className="text-gray-300">{prompt.created ? new Date(prompt.created).toLocaleString() : 'N/A'}</span></div>
        <div>Version: <span className="text-gray-300">{Array.isArray(prompt.versions) ? prompt.versions.length : 0}</span></div>
      </div>
    </aside>
  );
} 