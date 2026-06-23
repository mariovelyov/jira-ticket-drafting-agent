import { useRef, useState } from 'react';
import type { StoryFields } from '../components/StoryCard';
import type { BugFields } from '../components/BugCard';
import type { CreateStatus } from '../components/StoryCard';

export type DraftState =
  | { kind: 'story'; fields: StoryFields }
  | { kind: 'bug'; fields: BugFields };

export function useDrafts() {
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [createStatuses, setCreateStatuses] = useState<Record<string, CreateStatus>>({});
  const initializedRef = useRef<Set<string>>(new Set());

  // Called during render of page.tsx (the component that owns setDrafts).
  // React permits render-time state updates on the owning component - it discards
  // the in-progress render and immediately re-renders with the new state, avoiding
  // the empty-card flash that a useEffect approach would cause.
  // The ref guard makes it idempotent so only the first call per toolCallId fires.
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
            // Extra keys from the model are ignored by TypeScript but land in the object;
            // acceptable for a demo - all fields are sanitized before the Jira POST
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

  return { drafts, createStatuses, initDraft, updateDraft, handleCreate };
}
