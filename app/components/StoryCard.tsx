import { useState } from 'react';
import ListEditor from './ListEditor';

export type StoryFields = {
  summary: string;
  problemDescription: string;
  who: string;
  what: string;
  why: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  risks: string[];
  ux: string;
  analytics: string;
  releaseNotes: string;
  qa: string;
};

export type CreateStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; key: string; url: string }
  | { type: 'error'; message: string };

type Props = {
  fields: StoryFields;
  createStatus: CreateStatus;
  onUpdate: (patch: Partial<StoryFields>) => void;
  onCreate: () => void;
};

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';
const textareaCls = `${inputCls} resize-none`;
const labelCls = 'text-xs font-semibold text-gray-400 uppercase tracking-wide';
const sectionCls = 'space-y-1.5';

export default function StoryCard({ fields, createStatus, onUpdate, onCreate }: Props) {
  const [optionalOpen, setOptionalOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden animate-[fadeInUp_0.25s_ease]">
      {/* Card header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
          Story
        </span>
        <span className="text-sm text-gray-400 truncate">{fields.summary || 'Untitled story'}</span>
      </div>

      {/* Required fields */}
      <div className="px-4 py-4 space-y-4">
        <div className={sectionCls}>
          <label className={labelCls}>Summary</label>
          <input className={inputCls} value={fields.summary} onChange={(e) => onUpdate({ summary: e.target.value })} />
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Problem this solves</label>
          <textarea className={textareaCls} rows={3} value={fields.problemDescription} onChange={(e) => onUpdate({ problemDescription: e.target.value })} />
        </div>

        <div className="space-y-2">
          <label className={labelCls}>3W</label>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 w-12 shrink-0">(Who)</span>
            <input className={inputCls} value={fields.who} onChange={(e) => onUpdate({ who: e.target.value })} />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 w-12 shrink-0">(What)</span>
            <input className={inputCls} value={fields.what} onChange={(e) => onUpdate({ what: e.target.value })} />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 w-12 shrink-0">(Why)</span>
            <input className={inputCls} value={fields.why} onChange={(e) => onUpdate({ why: e.target.value })} />
          </div>
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Acceptance Criteria</label>
          <ListEditor
            items={fields.acceptanceCriteria}
            onChange={(items) => onUpdate({ acceptanceCriteria: items })}
            placeholder="As a [role] can I ...?"
          />
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
        <span className="text-gray-300 font-normal">Dependencies · Risks · UX · Analytics · Release notes · QA</span>
      </button>

      {/* Optional fields body */}
      {optionalOpen && (
        <div className="px-4 py-4 border-t border-gray-100 space-y-4">
          <div className={sectionCls}>
            <label className={labelCls}>Dependencies, Limitations</label>
            <ListEditor items={fields.dependencies} onChange={(items) => onUpdate({ dependencies: items })} />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>Risks, Security requirements & Threats</label>
            <ListEditor items={fields.risks} onChange={(items) => onUpdate({ risks: items })} />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>UX</label>
            <textarea className={textareaCls} rows={2} value={fields.ux} onChange={(e) => onUpdate({ ux: e.target.value })} />
          </div>

          <div className={sectionCls}>
            <label className={labelCls}>Analytics</label>
            <textarea className={textareaCls} rows={2} value={fields.analytics} onChange={(e) => onUpdate({ analytics: e.target.value })} />
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
              <p className="text-red-500 text-xs">{createStatus.message.slice(0, 120)}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
