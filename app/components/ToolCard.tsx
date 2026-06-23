import StoryCard from './StoryCard';
import BugCard from './BugCard';
import type { StoryFields } from './StoryCard';
import type { BugFields } from './BugCard';
import type { CreateStatus } from './StoryCard';
import type { DraftState } from '../hooks/useDrafts';

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  part: any;
  draft: DraftState | undefined;
  createStatus: CreateStatus;
  onUpdate: (patch: Partial<StoryFields> | Partial<BugFields>) => void;
  onCreate: () => void;
};

export default function ToolCard({ part, draft, createStatus, onUpdate, onCreate }: Props) {
  if (part.state === 'input-streaming' || part.state === 'input-available') {
    return (
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 space-y-3 animate-pulse">
        <div className="h-2.5 w-14 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-2.5 bg-gray-200 rounded-full w-full" />
          <div className="h-2.5 bg-gray-200 rounded-full w-3/4" />
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-gray-200 rounded-full w-1/2" />
          <div className="h-2.5 bg-gray-200 rounded-full w-full" />
          <div className="h-2.5 bg-gray-200 rounded-full w-3/4" />
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-gray-200 rounded-full w-full" />
          <div className="h-2.5 bg-gray-200 rounded-full w-1/2" />
        </div>
      </div>
    );
  }

  if (part.state === 'output-error') {
    return (
      <div className="text-red-600 text-sm">
        Error drafting ticket: {part.errorText}
      </div>
    );
  }

  if (part.state === 'output-available') {
    if (!draft) return null;

    const followUp = createStatus.type === 'success' ? (
      <div className="text-gray-700 text-sm bg-white border border-gray-200 rounded-2xl px-4 py-3 max-w-prose">
        <span className="font-medium">{createStatus.key}</span> created in Jira.{' '}
        Got another bug or feature to draft?
      </div>
    ) : null;

    if (draft.kind === 'story') {
      return (
        <div className="space-y-3">
          <StoryCard
            fields={draft.fields}
            createStatus={createStatus}
            onUpdate={onUpdate}
            onCreate={onCreate}
          />
          {followUp}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <BugCard
          fields={draft.fields}
          createStatus={createStatus}
          onUpdate={onUpdate}
          onCreate={onCreate}
        />
        {followUp}
      </div>
    );
  }

  return null;
}
