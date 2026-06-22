'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';
import StoryCard, { type StoryFields } from './components/StoryCard';
import BugCard, { type BugFields } from './components/BugCard';
import type { CreateStatus } from './components/StoryCard';

type DraftState =
  | { kind: 'story'; fields: StoryFields }
  | { kind: 'bug'; fields: BugFields };

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [createStatuses, setCreateStatuses] = useState<Record<string, CreateStatus>>({});
  const initializedRef = useRef<Set<string>>(new Set());

  function updateDraft(toolCallId: string, patch: Partial<StoryFields> | Partial<BugFields>) {
    setDrafts((prev) => {
      const current = prev[toolCallId];
      if (!current) return prev;
      return {
        ...prev,
        [toolCallId]: { ...current, fields: { ...current.fields, ...patch } } as DraftState,
      };
    });
  }

  async function handleCreate(toolCallId: string) {
    const draft = drafts[toolCallId];
    if (!draft) return;

    const payload =
      draft.kind === 'story'
        ? { issueType: 'Story', ...draft.fields }
        : { issueType: 'Bug', ...draft.fields };

    setCreateStatuses((prev) => ({ ...prev, [toolCallId]: { type: 'loading' } }));
    try {
      const res = await fetch('/api/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  function initDraft(toolCallId: string, kind: 'story' | 'bug', output: Record<string, unknown>) {
    if (initializedRef.current.has(toolCallId)) return;
    initializedRef.current.add(toolCallId);

    if (kind === 'story') {
      setDrafts((prev) => ({
        ...prev,
        [toolCallId]: {
          kind: 'story',
          fields: {
            summary: '',
            problemDescription: '',
            who: '',
            what: '',
            why: '',
            acceptanceCriteria: [],
            dependencies: [],
            risks: [],
            ux: '',
            analytics: '',
            releaseNotes: '',
            qa: '',
            ...output,
          } as StoryFields,
        },
      }));
    } else {
      setDrafts((prev) => ({
        ...prev,
        [toolCallId]: {
          kind: 'bug',
          fields: {
            summary: '',
            zendeskUrl: '',
            preconditions: [],
            stepsToReproduce: [],
            expectedOutcome: '',
            actualOutcome: '',
            additionalNotes: '',
            releaseNotes: '',
            qa: '',
            ...output,
          } as BugFields,
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

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const toolPart = part as any;
              const toolCallId: string = toolPart.toolCallId;

              if (part.type === 'tool-draftStory' || part.type === 'tool-draftBug') {
                const kind = part.type === 'tool-draftStory' ? 'story' : 'bug';

                if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                  return (
                    <div key={partIndex} className="text-gray-400 text-sm italic">
                      Drafting ticket...
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
                  initDraft(toolCallId, kind, toolPart.output);
                  const draft = drafts[toolCallId];
                  const createStatus = createStatuses[toolCallId] ?? { type: 'idle' };
                  if (!draft) return null;

                  if (draft.kind === 'story') {
                    return (
                      <StoryCard
                        key={partIndex}
                        fields={draft.fields}
                        createStatus={createStatus}
                        onUpdate={(patch) => updateDraft(toolCallId, patch)}
                        onCreate={() => handleCreate(toolCallId)}
                      />
                    );
                  }

                  return (
                    <BugCard
                      key={partIndex}
                      fields={draft.fields}
                      createStatus={createStatus}
                      onUpdate={(patch) => updateDraft(toolCallId, patch)}
                      onCreate={() => handleCreate(toolCallId)}
                    />
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
            placeholder="Describe a bug or feature request..."
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
