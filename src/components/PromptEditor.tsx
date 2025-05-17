'use client';
import React, { useState, useEffect, useRef } from "react";
import { usePromptStore } from "../store/promptStore";

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 24 && /^[\w\- ]+$/.test(t));
}

export default function PromptEditor() {
  const selectedPromptId = usePromptStore((s) => s.selectedPromptId);
  const prompts = usePromptStore((s) => s.prompts);
  const setSelectedPrompt = usePromptStore((s) => s.setSelectedPrompt);
  const addPrompt = usePromptStore((s) => s.addPrompt);
  const updatePrompt = usePromptStore((s) => s.updatePrompt);

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || null;

  // Track if we're in "create" or "edit" mode
  const [mode, setMode] = useState<"create" | "edit">(selectedPrompt ? "edit" : "create");

  // Local state for form fields
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const prevSelectedPromptId = useRef<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with selected prompt
  useEffect(() => {
    if (selectedPrompt) {
      setTitle(selectedPrompt.title);
      setTags(selectedPrompt.tags.join(", "));
      setPrompt(selectedPrompt.content);
      setMode("edit");
    } else {
      setTitle("");
      setTags("");
      setPrompt("");
      setMode("create");
    }
    setError("");
    setSuccess("");
    setDirty(false);
    prevSelectedPromptId.current = selectedPromptId;
  }, [selectedPromptId]);

  // Track dirty state
  useEffect(() => {
    if (!selectedPrompt && (title || tags || prompt)) {
      setDirty(true);
      return;
    }
    if (
      selectedPrompt &&
      (title !== selectedPrompt.title ||
        tags !== selectedPrompt.tags.join(", ") ||
        prompt !== selectedPrompt.content)
    ) {
      setDirty(true);
    } else {
      setDirty(false);
    }
  }, [title, tags, prompt, selectedPrompt]);

  // Keyboard shortcut: Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Warn on unsaved changes
  const confirmDiscard = () => {
    if (dirty) {
      return window.confirm("You have unsaved changes. Discard them?");
    }
    return true;
  };

  // Handle "New Prompt" button
  const handleNewPrompt = () => {
    if (!confirmDiscard()) return;
    setSelectedPrompt(null);
    setTitle("");
    setTags("");
    setPrompt("");
    setMode("create");
    setError("");
    setSuccess("");
    setDirty(false);
  };

  // Handle Save (create or update)
  const handleSave = () => {
    if (saving) return;
    setError("");
    setSuccess("");
    if (!title.trim() || !prompt.trim()) {
      setError("Title and prompt content are required.");
      return;
    }
    if (prompt.trim().length < 10) {
      setError("Prompt content must be at least 10 characters.");
      return;
    }
    // Prevent duplicate titles
    const duplicate = prompts.find(
      (p) => p.title.trim().toLowerCase() === title.trim().toLowerCase() && (mode === "create" || (selectedPrompt && p.id !== selectedPrompt.id))
    );
    if (duplicate) {
      setError("A prompt with this title already exists.");
      return;
    }
    // Validate tags
    const tagArr = parseTags(tags);
    if (tags && tagArr.length === 0) {
      setError("Tags must be alphanumeric, max 24 chars each.");
      return;
    }
    setSaving(true);
    if (mode === "create") {
      // Add prompt and select it
      const newId = addPrompt({
        title: title.trim(),
        tags: tagArr,
        content: prompt.trim(),
      });
      setSelectedPrompt(newId);
      setSuccess("Prompt created!");
      setSaving(false);
      setDirty(false);
    } else if (selectedPrompt) {
      updatePrompt(selectedPrompt.id, {
        title: title.trim(),
        tags: tagArr,
        content: prompt.trim(),
      });
      setSuccess("Changes saved.");
      setSaving(false);
      setDirty(false);
    }
  };

  // Handle prompt switching with unsaved changes
  useEffect(() => {
    if (
      prevSelectedPromptId.current !== null &&
      selectedPromptId !== prevSelectedPromptId.current &&
      dirty
    ) {
      if (!confirmDiscard()) {
        setSelectedPrompt(prevSelectedPromptId.current);
      }
    }
    prevSelectedPromptId.current = selectedPromptId;
  }, [selectedPromptId]);

  // Focus title input after save
  useEffect(() => {
    if (success && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [success]);

  useEffect(() => {
    // Add spinner animation style on client only
    const style = document.createElement('style');
    style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18 }} aria-live="polite">
          {mode === "edit" && selectedPrompt
            ? `Editing: ${selectedPrompt.title}`
            : "Creating New Prompt"}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ padding: 8, fontSize: 14, background: '#27272a', color: '#d4d4d8', borderRadius: 6, border: '1px solid #3f3f46' }}
            onClick={handleNewPrompt}
            aria-label="New Prompt"
          >
            New Prompt
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <input
          style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #27272a', background: '#18181b', color: '#fafafa', fontSize: 16 }}
          placeholder="Prompt Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          aria-label="Prompt Title"
          ref={titleInputRef}
        />
        <input
          style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #27272a', background: '#18181b', color: '#fafafa', fontSize: 16 }}
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          aria-label="Tags"
        />
        <textarea
          style={{ width: '100%', height: 120, padding: 8, borderRadius: 6, border: '1px solid #27272a', background: '#18181b', color: '#fafafa', fontSize: 16, resize: 'none' }}
          placeholder="Write your prompt here..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          aria-label="Prompt Content"
        />
        {error && (
          <div style={{ color: "#f87171", fontSize: 14, marginTop: 4 }} role="alert" id="prompt-editor-error">{error}</div>
        )}
        {success && (
          <div style={{ color: "#22c55e", fontSize: 14, marginTop: 4 }} role="status">{success}</div>
        )}
      </div>
      <div>
        <button
          onClick={handleSave}
          style={{ padding: 16, fontSize: 18, background: saving ? '#94a3b8' : '#2563eb', color: 'white', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer' }}
          disabled={saving}
          aria-label={mode === "edit" ? "Save Changes" : "Create Prompt"}
          aria-describedby={error ? "prompt-editor-error" : undefined}
        >
          {saving ? (
            <span>
              <span className="spinner" style={{ marginRight: 8, display: 'inline-block', width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Saving...
            </span>
          ) : mode === "edit" ? "Save Changes" : "Create Prompt"}
        </button>
      </div>
    </div>
  );
} 