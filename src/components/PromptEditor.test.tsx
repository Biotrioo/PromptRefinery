import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePromptStore } from '../store/promptStore';
import PromptEditor from './PromptEditor';

// Mock Zustand store
vi.mock('../store/promptStore', async () => {
  let prompts = [
    { id: 1, title: 'Test Prompt', tags: ['Dev'], content: 'Test content here.' },
  ];
  let selectedPromptId: number | null = null;
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    usePromptStore: vi.fn((selector: unknown) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector as any)({
        prompts,
        selectedPromptId,
        setSelectedPrompt: (id: number | null) => { selectedPromptId = id; },
        addPrompt: (prompt: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newId = prompts.length + 1;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prompts.push({ ...(prompt as any), id: newId });
          return newId;
        },
        updatePrompt: (id: number, data: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prompts = prompts.map((p) => (p.id === id ? { ...p, ...(data as any) } : p));
        },
      })
    ),
  };
});

describe('PromptEditor', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('creates a new prompt successfully', async () => {
    render(<PromptEditor />);
    fireEvent.change(screen.getByLabelText(/Prompt Title/i), { target: { value: 'New Prompt' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'Dev, Test' } });
    fireEvent.change(screen.getByLabelText(/Prompt Content/i), { target: { value: 'This is a valid prompt content.' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Prompt/i }));
    await waitFor(() => {
      expect(screen.getByText(/Prompt created!/i)).toBeInTheDocument();
    });
  });

  it('shows error for duplicate title', async () => {
    render(<PromptEditor />);
    fireEvent.change(screen.getByLabelText(/Prompt Title/i), { target: { value: 'Test Prompt' } });
    fireEvent.change(screen.getByLabelText(/Prompt Content/i), { target: { value: 'Another valid content.' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Prompt/i }));
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('shows error for short prompt content', async () => {
    render(<PromptEditor />);
    fireEvent.change(screen.getByLabelText(/Prompt Title/i), { target: { value: 'Short Content' } });
    fireEvent.change(screen.getByLabelText(/Prompt Content/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Prompt/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it('edits an existing prompt', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usePromptStore as unknown as any).mockImplementation((selector: unknown) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector as any)({
        prompts: [
          { id: 1, title: 'Test Prompt', tags: ['Dev'], content: 'Test content here.' },
        ],
        selectedPromptId: 1,
        setSelectedPrompt: vi.fn(),
        addPrompt: vi.fn(),
        updatePrompt: vi.fn(),
      })
    );
    render(<PromptEditor />);
    fireEvent.change(screen.getByLabelText(/Prompt Title/i), { target: { value: 'Test Prompt Edited' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => {
      expect(screen.getByText(/Changes saved/i)).toBeInTheDocument();
    });
  });

  it('warns on unsaved changes when switching', async () => {
    window.confirm = vi.fn(() => false); // User cancels
    render(<PromptEditor />);
    fireEvent.change(screen.getByLabelText(/Prompt Title/i), { target: { value: 'Unsaved' } });
    fireEvent.click(screen.getByLabelText(/New Prompt/i));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/unsaved changes/i));
  });
}); 