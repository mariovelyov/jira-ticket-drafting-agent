import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { draftTicket } from '@/lib/tools/draftTicket';

export const maxDuration = 30;

const SYSTEM_PROMPT = `You help engineers turn a plain-English bug/feature description into a
well-formed Jira ticket. When the user describes a problem or request,
call draftTicket with:
- summary: a concise title (<10 words)
- issueType: "Bug" or "Task"
- description: 2-4 sentences explaining the problem/request
- acceptanceCriteria: 2-4 bullet points of what "done" looks like

Ask one clarifying question first ONLY if the request is too vague to
draft (e.g. missing what page/feature is affected). Otherwise draft
immediately — don't over-interrogate the user.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic((process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5') as Parameters<typeof anthropic>[0]),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { draftTicket },
  });

  return result.toUIMessageStreamResponse();
}
