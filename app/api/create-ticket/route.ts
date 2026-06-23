import { z } from 'zod';

type AdfNode = Record<string, unknown>;

const sanitize = (s: string): string => s.replace(/<[^>]*>/g, '').trim();
const sanitizeList = (items: string[]): string[] => items.map(sanitize);

const bodySchema = z.discriminatedUnion('issueType', [
  z.object({
    issueType: z.literal('Story'),
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
  z.object({
    issueType: z.literal('Bug'),
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
]);

function heading(text: string): AdfNode {
  return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] };
}

function paragraph(text: string): AdfNode {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function bulletList(items: string[]): AdfNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
    })),
  };
}

function buildStoryADF(b: z.infer<typeof bodySchema> & { issueType: 'Story' }): AdfNode {
  const content: AdfNode[] = [
    heading('Problem this solves'),
    paragraph(sanitize(b.problemDescription)),
    heading('3W'),
    bulletList([
      `(Who) ${sanitize(b.who)}`,
      `(What) ${sanitize(b.what)}`,
      `(Why) ${sanitize(b.why)}`,
    ]),
    heading('Acceptance Criteria'),
    bulletList(sanitizeList(b.acceptanceCriteria)),
  ];

  if (b.dependencies?.length) content.push(heading('Dependencies, Limitations'), bulletList(sanitizeList(b.dependencies)));
  if (b.risks?.length) content.push(heading('Risks, Security requirements & Threats'), bulletList(sanitizeList(b.risks)));
  if (b.ux) content.push(heading('UX'), paragraph(sanitize(b.ux)));
  if (b.analytics) content.push(heading('Analytics'), paragraph(sanitize(b.analytics)));
  if (b.releaseNotes) content.push(heading('Release notes'), paragraph(sanitize(b.releaseNotes)));
  if (b.qa) content.push(heading('QA'), paragraph(sanitize(b.qa)));

  return { type: 'doc', version: 1, content };
}

function buildBugADF(b: z.infer<typeof bodySchema> & { issueType: 'Bug' }): AdfNode {
  const content: AdfNode[] = [];

  if (b.zendeskUrl) content.push(paragraph(`Zendesk: ${sanitize(b.zendeskUrl)}`));
  if (b.preconditions?.length) content.push(heading('Preconditions'), bulletList(sanitizeList(b.preconditions)));

  content.push(
    heading('Steps to reproduce'),
    bulletList(sanitizeList(b.stepsToReproduce)),
    heading('Expected outcome'),
    paragraph(sanitize(b.expectedOutcome)),
    heading('Actual outcome'),
    paragraph(sanitize(b.actualOutcome)),
  );

  if (b.additionalNotes) content.push(heading('Additional notes'), paragraph(sanitize(b.additionalNotes)));
  if (b.releaseNotes) content.push(heading('Release notes'), paragraph(sanitize(b.releaseNotes)));
  if (b.qa) content.push(heading('QA'), paragraph(sanitize(b.qa)));

  return { type: 'doc', version: 1, content };
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const summary = sanitize(body.summary);
  // Strip trailing slash so JIRA_BASE_URL works with or without one
  const base = process.env.JIRA_BASE_URL?.replace(/\/$/, '');

  try {
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString('base64');

    const description = body.issueType === 'Bug' ? buildBugADF(body) : buildStoryADF(body);

    const res = await fetch(`${base}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: process.env.JIRA_PROJECT_KEY },
          summary,
          issuetype: { name: body.issueType },
          description,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: JSON.stringify(data) }, { status: res.status });
    }

    return Response.json({
      key: data.key,
      url: `${base}/browse/${data.key}`,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
