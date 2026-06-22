import { tool } from 'ai';
import { z } from 'zod';

export const draftBug = tool({
  description: 'Structure a bug report into a Jira bug ticket',
  inputSchema: z.object({
    summary: z.string(),
    zendeskUrl: z.string().optional(),
    preconditions: z.array(z.string()).optional(),
    stepsToReproduce: z.array(z.string()),
    expectedOutcome: z.string(),
    actualOutcome: z.string(),
    additionalNotes: z.string().optional(),
    releaseNotes: z.string().optional(),
    qa: z.string().optional(),
  }),
  execute: async (fields) => fields,
});
