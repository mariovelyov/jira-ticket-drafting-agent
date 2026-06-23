import { useState } from 'react';
import type { CreateStatus } from './StoryCard';

export type BugFields = {
  summary: string;
  zendeskUrl: string;
  preconditions: string[];
  stepsToReproduce: string[];
  expectedOutcome: string;
  actualOutcome: string;
  additionalNotes: string;
  releaseNotes: string;
  qa: string;
};

export type { CreateStatus };

type Props = {
  fields: BugFields;
  createStatus: CreateStatus;
  onUpdate: (patch: Partial<BugFields>) => void;
  onCreate: () => void;
};

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-gray-300 hover:text-red-400 text-sm px-2 transition-colors"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="text-blue-400 hover:text-blue-600 text-xs font-medium transition-colors"
      >
        + Add
      </button>
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';
const textareaCls = `${inputCls} resize-none`;
const labelCls = 'text-xs font-semibold text-gray-400 uppercase tracking-wide';
const sectionCls = 'space-y-1.5';

export default function BugCard({ fields, createStatus, onUpdate, onCreate }: Props) {
  const [optionalOpen, setOptionalOpen] = useState(false);

  return (
    <div className="border border-red-100 rounded-xl bg-white shadow-sm overflow-hidden animate-[fadeInUp_0.25s_ease]">
      {/* Card header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-red-50">
        <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
          Bug
        </span>
        <span className="text-sm text-gray-400 truncate">{fields.summary || 'Untitled bug'}</span>
      </div>

      {/* Required fields */}
      <div className="px-4 py-4 space-y-4">
        <div className={sectionCls}>
          <label className={labelCls}>Summary</label>
          <input className={inputCls} value={fields.summary} onChange={(e) => onUpdate({ summary: e.target.value })} />
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Zendesk URL <span className="normal-case font-normal text-gray-300">(optional)</span></label>
          <input className={inputCls} value={fields.zendeskUrl} placeholder="https://..." onChange={(e) => onUpdate({ zendeskUrl: e.target.value })} />
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Preconditions</label>
          <ListEditor items={fields.preconditions} onChange={(items) => onUpdate({ preconditions: items })} placeholder="Required setup or state..." />
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Steps to reproduce</label>
          <ListEditor items={fields.stepsToReproduce} onChange={(items) => onUpdate({ stepsToReproduce: items })} placeholder="Step..." />
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Expected outcome</label>
          <textarea className={textareaCls} rows={2} value={fields.expectedOutcome} onChange={(e) => onUpdate({ expectedOutcome: e.target.value })} />
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Actual outcome</label>
          <textarea className={textareaCls} rows={2} value={fields.actualOutcome} onChange={(e) => onUpdate({ actualOutcome: e.target.value })} />
        </div>
      </div>

      {/* Optional fields toggle */}
      <button
        type="button"
        onClick={() => setOptionalOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left"
      >
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${optionalOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium">Optional fields</span>
        <span className="text-gray-300 font-normal">Additional notes · Release notes · QA</span>
      </button>

      {/* Optional fields body */}
      {optionalOpen && (
        <div className="px-4 py-4 border-t border-gray-100 space-y-4">
          <div className={sectionCls}>
            <label className={labelCls}>Additional notes</label>
            <textarea className={textareaCls} rows={2} value={fields.additionalNotes} onChange={(e) => onUpdate({ additionalNotes: e.target.value })} />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>Release notes</label>
            <input className={inputCls} value={fields.releaseNotes} onChange={(e) => onUpdate({ releaseNotes: e.target.value })} />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>QA</label>
            <input className={inputCls} value={fields.qa} onChange={(e) => onUpdate({ qa: e.target.value })} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
        {createStatus.type === 'success' ? (
          <a
            href={createStatus.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-green-700 font-medium text-sm hover:underline"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M13 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM5.5 8l2 2L11 5.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {createStatus.key} created ↗
          </a>
        ) : (
          <>
            <button
              type="button"
              onClick={onCreate}
              disabled={createStatus.type === 'loading'}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {createStatus.type === 'loading' ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : 'Create in Jira'}
            </button>
            {createStatus.type === 'error' && (
              <p className="text-red-500 text-xs">{createStatus.message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
