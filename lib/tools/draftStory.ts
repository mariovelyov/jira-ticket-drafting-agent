import { tool } from 'ai';
import { z } from 'zod';

export const draftStory = tool({
  description: 'Structure a feature or improvement into a Jira story using the 3W format',
  inputSchema: z.object({
    summary: z.string(),
    problemDescription: z.string(),
    who: z.string(),
    what: z.string(),
    why: z.string(),
    acceptanceCriteria: z.array(z.string()),
    dependencies: z.array(z.string()).optional(),
    risks: z.array(z.string()).optional(),
    ux: z.string().optional(),
    analytics: z.string().optional(),
    releaseNotes: z.string().optional(),
    qa: z.string().optional(),
  }),
  execute: async (fields) => fields,
});
