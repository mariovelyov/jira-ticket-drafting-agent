import { tool } from 'ai';
import { z } from 'zod';

export const draftTicket = tool({
  description: 'Structure a bug/feature request into Jira ticket fields',
  inputSchema: z.object({
    summary: z.string(),
    issueType: z.enum(['Bug', 'Story']),
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
  }),
  execute: async (fields) => fields,
});
