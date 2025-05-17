import { describe, it, expect, beforeEach } from 'vitest';
import { usePromptStore } from './promptStore';

// Helper to reset Zustand store state between tests
function resetStore() {
  usePromptStore.setState({
    prompts: [
      { id: 1, title: "Summarize Article", tags: ["Dev", "Agent"], content: "Summarize the following article..." },
      { id: 2, title: "Creative Story", tags: ["Creative"], content: "Write a story about..." },
    ],
    selectedPromptId: null,
    activeTag: "All",
  });
}

describe('promptStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('adds a prompt', () => {
    usePromptStore.getState().addPrompt({
      title: 'Test',
      tags: ['Dev'],
      content: 'Test content',
    });
    const prompts = usePromptStore.getState().prompts;
    expect(prompts.length).toBe(3);
    expect(prompts[2].title).toBe('Test');
  });

  it('filters prompts by tag', () => {
    usePromptStore.getState().setActiveTag('Creative');
    const filtered = usePromptStore.getState().getPrompts();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Creative Story');
  });
}); 