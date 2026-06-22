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
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-gray-400 hover:text-red-500 text-sm px-2"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="text-blue-500 hover:text-blue-700 text-xs"
      >
        + Add
      </button>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const textareaCls = `${inputCls} resize-none`;
const labelCls = 'text-xs text-gray-500';
const sectionCls = 'space-y-1';

export default function StoryCard({ fields, createStatus, onUpdate, onCreate }: Props) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Story</p>

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

      <div className="pt-1 flex items-center gap-3">
        {createStatus.type === 'success' ? (
          <a href={createStatus.url} target="_blank" rel="noopener noreferrer" className="text-green-700 font-medium text-sm">
            Created: {createStatus.key} ↗
          </a>
        ) : (
          <>
            <button
              onClick={onCreate}
              disabled={createStatus.type === 'loading'}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {createStatus.type === 'loading' ? 'Creating...' : 'Create in Jira'}
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
