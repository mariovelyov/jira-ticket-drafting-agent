'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import ToolCard from './components/ToolCard';
import { useDrafts } from './hooks/useDrafts';

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const { drafts, createStatuses, initDraft, updateDraft, handleCreate } = useDrafts();

  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Jira Ticket Drafter</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-700 text-sm bg-white border border-gray-200 rounded-2xl px-4 py-3 max-w-prose space-y-2 mt-8">
            <p>Hi! Describe a bug or feature and I&apos;ll draft a structured Jira ticket for you.</p>
            <p className="text-gray-500">
              <span className="font-medium text-gray-700">Bug</span> - what&apos;s broken, where it happens, and what you expected instead.
            </p>
            <p className="text-gray-500">
              <span className="font-medium text-gray-700">Story</span> - who needs it, what they want to do, and why it matters.
            </p>
          </div>
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

              if (part.type === 'tool-draftStory' || part.type === 'tool-draftBug') {
                const kind = part.type === 'tool-draftStory' ? 'story' : 'bug';
                const { toolCallId } = toolPart;
                if (toolPart.state === 'output-available') {
                  initDraft(toolCallId, kind, toolPart.output);
                }
                return (
                  <ToolCard
                    key={partIndex}
                    part={toolPart}
                    draft={drafts[toolCallId]}
                    createStatus={createStatuses[toolCallId] ?? { type: 'idle' }}
                    onUpdate={(patch) => updateDraft(toolCallId, patch)}
                    onCreate={() => handleCreate(toolCallId)}
                  />
                );
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
