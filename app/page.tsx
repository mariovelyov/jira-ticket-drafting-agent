'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';

type DraftFields = {
  summary: string;
  issueType: 'Bug' | 'Story';
  description: string;
  acceptanceCriteria: string[];
};

type CreateStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; key: string; url: string }
  | { type: 'error'; message: string };

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DraftFields>>({});
  const [createStatuses, setCreateStatuses] = useState<Record<string, CreateStatus>>({});
  const initializedRef = useRef<Set<string>>(new Set());

  function updateDraft(toolCallId: string, patch: Partial<DraftFields>) {
    setDrafts((prev) => ({
      ...prev,
      [toolCallId]: { ...prev[toolCallId], ...patch },
    }));
  }

  function addCriteria(toolCallId: string) {
    setDrafts((prev) => ({
      ...prev,
      [toolCallId]: {
        ...prev[toolCallId],
        acceptanceCriteria: [...prev[toolCallId].acceptanceCriteria, ''],
      },
    }));
  }

  function removeCriteria(toolCallId: string, index: number) {
    setDrafts((prev) => ({
      ...prev,
      [toolCallId]: {
        ...prev[toolCallId],
        acceptanceCriteria: prev[toolCallId].acceptanceCriteria.filter((_, i) => i !== index),
      },
    }));
  }

  async function handleCreate(toolCallId: string) {
    const fields = drafts[toolCallId];
    if (!fields) return;
    setCreateStatuses((prev) => ({ ...prev, [toolCallId]: { type: 'loading' } }));
    try {
      const res = await fetch('/api/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setCreateStatuses((prev) => ({
        ...prev,
        [toolCallId]: { type: 'success', key: data.key, url: data.url },
      }));
    } catch (err) {
      setCreateStatuses((prev) => ({
        ...prev,
        [toolCallId]: {
          type: 'error',
          message: err instanceof Error ? err.message : 'Request failed',
        },
      }));
    }
  }

  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Jira Ticket Drafter</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-16">
            Describe a bug or feature request and I&apos;ll draft a Jira ticket for you.
          </p>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {message.parts.map((part, partIndex) => {
              if (part.type === 'text') {
                return (
                  <div
                    key={partIndex}
                    className={
                      message.role === 'user'
                        ? 'ml-auto bg-blue-600 text-white rounded-2xl px-4 py-2 max-w-prose text-sm w-fit'
                        : 'text-gray-800 text-sm max-w-prose'
                    }
                  >
                    {part.text}
                  </div>
                );
              }

              if (part.type === 'tool-draftTicket') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const toolPart = part as any;
                const toolCallId: string = toolPart.toolCallId;

                if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                  return (
                    <div key={partIndex} className="text-gray-400 text-sm italic">
                      Drafting ticket…
                    </div>
                  );
                }

                if (toolPart.state === 'output-error') {
                  return (
                    <div key={partIndex} className="text-red-600 text-sm">
                      Error drafting ticket: {toolPart.errorText}
                    </div>
                  );
                }

                if (toolPart.state === 'output-available') {
                  // Initialize draft state from model output once, without fighting user edits
                  if (!initializedRef.current.has(toolCallId)) {
                    initializedRef.current.add(toolCallId);
                    setDrafts((prev) => ({
                      ...prev,
                      [toolCallId]: { ...toolPart.output },
                    }));
                  }

                  const draft = drafts[toolCallId];
                  const createStatus = createStatuses[toolCallId] ?? { type: 'idle' };

                  if (!draft) return null;

                  return (
                    <div
                      key={partIndex}
                      className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-3"
                    >
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Draft Ticket
                      </p>

                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Summary</label>
                        <input
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={draft.summary}
                          onChange={(e) => updateDraft(toolCallId, { summary: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Issue Type</label>
                        <select
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          value={draft.issueType}
                          onChange={(e) =>
                            updateDraft(toolCallId, {
                              issueType: e.target.value as 'Bug' | 'Story',
                            })
                          }
                        >
                          <option value="Bug">Bug</option>
                          <option value="Story">Story</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Description</label>
                        <textarea
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          value={draft.description}
                          onChange={(e) =>
                            updateDraft(toolCallId, { description: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Acceptance Criteria</label>
                        {draft.acceptanceCriteria.map((criterion, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={criterion}
                              onChange={(e) => {
                                const updated = [...draft.acceptanceCriteria];
                                updated[i] = e.target.value;
                                updateDraft(toolCallId, { acceptanceCriteria: updated });
                              }}
                            />
                            <button
                              onClick={() => removeCriteria(toolCallId, i)}
                              className="text-gray-400 hover:text-red-500 text-sm px-2"
                              aria-label="Remove criterion"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addCriteria(toolCallId)}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                        >
                          + Add criterion
                        </button>
                      </div>

                      <div className="pt-1 flex items-center gap-3">
                        {createStatus.type === 'success' ? (
                          <a
                            href={createStatus.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 font-medium text-sm"
                          >
                            Created: {createStatus.key} ↗
                          </a>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCreate(toolCallId)}
                              disabled={createStatus.type === 'loading'}
                              className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              {createStatus.type === 'loading' ? 'Creating…' : 'Create in Jira'}
                            </button>
                            {createStatus.type === 'error' && (
                              <p className="text-red-600 text-xs">{createStatus.message}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              }

              return null;
            })}
          </div>
        ))}
      </main>

      <footer className="bg-white border-t border-gray-200 px-4 py-3 max-w-2xl w-full mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || isBusy) return;
            sendMessage({ text: input });
            setInput('');
          }}
          className="flex gap-2"
        >
          <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe a bug or feature request…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
