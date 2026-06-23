'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';
import ToolCard from './components/ToolCard';
import { useDrafts } from './hooks/useDrafts';

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const { drafts, createStatuses, initDraft, updateDraft, handleCreate } = useDrafts();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = status === 'submitted' || status === 'streaming';

  function submit() {
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input });
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl w-full mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 3.5h9M2.5 7h6M2.5 10.5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-gray-900">Jira Ticket Drafter</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-3 pt-24">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-1">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M4.5 7.5h17M4.5 13h12M4.5 18.5h7.5" stroke="#2563eb" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-900">Draft a Jira ticket</p>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Describe a bug or feature in plain language - AI classifies it and fills in the ticket structure for you.
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

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-2xl w-full mx-auto px-4 py-3 space-y-1.5">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none leading-relaxed transition-colors"
              placeholder="Describe a bug or feature request..."
              value={input}
              disabled={isBusy}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim() || isBusy}
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Press <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Enter</kbd> to send
            &nbsp;·&nbsp;
            <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px] text-gray-500">Shift+Enter</kbd> for new line
          </p>
        </div>
      </footer>
    </div>
  );
}
