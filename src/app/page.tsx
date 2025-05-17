'use client';
import Sidebar from "../components/Sidebar";
import PromptVault from "../components/PromptVault";
import PromptEditor from "../components/PromptEditor";
import PromptCritique from "../components/PromptCritique";
import { HydrationGuard } from "../components/HydrationGuard";
import PromptPreviewPanel from "../components/PromptPreviewPanel";
import { usePromptStore } from "../store/promptStore";
import { migrateToIndexedDBIfPossible } from "../store/promptStore";
import { useEffect } from "react";

export default function Home() {
  const selectedPromptId = usePromptStore((s) => s.selectedPromptId);
  const prompts = usePromptStore((s) => s.prompts);
  const setSelectedPrompt = usePromptStore((s) => s.setSelectedPrompt);
  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || null;

  useEffect(() => {
    migrateToIndexedDBIfPossible();
  }, []);

  // Placeholder for editor focus/scroll
  const handleEdit = () => {
    // TODO: Scroll/focus PromptEditor
    if (selectedPromptId) {
      // Optionally, scroll to editor or highlight
    }
  };

  return (
    <>
      <HydrationGuard>
        <div className="flex h-screen min-h-0 bg-gray-950 text-gray-100">
          <Sidebar />
          <main className="flex flex-1 min-h-0 overflow-y-auto">
            <section className="w-1/3 border-r border-gray-800 p-4 overflow-y-auto min-h-0">
              {/* <PromptVaultClient /> */}
              <PromptVault />
            </section>
            <section className="flex-1 flex flex-col md:flex-row min-h-0">
              <div className="flex-1 flex flex-col h-full min-h-0 p-4 border-b md:border-b-0 md:border-r border-gray-800">
                <button onClick={() => alert('New Prompt!')} style={{ marginBottom: 16 }}>New Prompt (Test)</button>
                <PromptEditor />
              </div>
              <div className="flex-1 p-4 min-h-0">
                <PromptCritique />
              </div>
            </section>
            {/* Prompt Preview Panel (drawer) */}
            <PromptPreviewPanel
              open={!!selectedPrompt}
              prompt={selectedPrompt}
              onClose={() => setSelectedPrompt(null)}
              onEdit={handleEdit}
            />
          </main>
        </div>
      </HydrationGuard>
    </>
  );
}
