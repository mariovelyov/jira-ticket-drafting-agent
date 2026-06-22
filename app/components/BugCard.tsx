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

export default function BugCard({ fields, createStatus, onUpdate, onCreate }: Props) {
  return (
    <div className="border border-red-200 rounded-xl p-4 bg-white shadow-sm space-y-4">
      <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Bug</p>

      <div className={sectionCls}>
        <label className={labelCls}>Summary</label>
        <input className={inputCls} value={fields.summary} onChange={(e) => onUpdate({ summary: e.target.value })} />
      </div>

      <div className={sectionCls}>
        <label className={labelCls}>Zendesk ticket URL (optional)</label>
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
