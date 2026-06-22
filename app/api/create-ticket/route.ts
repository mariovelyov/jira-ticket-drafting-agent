type AdfNode = Record<string, unknown>;

const sanitize = (s: string): string => s.replace(/<[^>]*>/g, '').trim();
const sanitizeList = (items: string[]): string[] => items.map(sanitize);

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

function buildStoryADF(b: Record<string, unknown>): AdfNode {
  const content: AdfNode[] = [
    heading('Problem this solves'),
    paragraph(sanitize(b.problemDescription as string)),
    heading('3W'),
    bulletList([
      `(Who) ${sanitize(b.who as string)}`,
      `(What) ${sanitize(b.what as string)}`,
      `(Why) ${sanitize(b.why as string)}`,
    ]),
    heading('Acceptance Criteria'),
    bulletList(sanitizeList(b.acceptanceCriteria as string[])),
  ];

  const deps = b.dependencies as string[] | undefined;
  const risks = b.risks as string[] | undefined;

  if (deps?.length) content.push(heading('Dependencies, Limitations'), bulletList(sanitizeList(deps)));
  if (risks?.length) content.push(heading('Risks, Security requirements & Threats'), bulletList(sanitizeList(risks)));
  if (b.ux) content.push(heading('UX'), paragraph(sanitize(b.ux as string)));
  if (b.analytics) content.push(heading('Analytics'), paragraph(sanitize(b.analytics as string)));
  if (b.releaseNotes) content.push(heading('Release notes'), paragraph(sanitize(b.releaseNotes as string)));
  if (b.qa) content.push(heading('QA'), paragraph(sanitize(b.qa as string)));

  return { type: 'doc', version: 1, content };
}

function buildBugADF(b: Record<string, unknown>): AdfNode {
  const content: AdfNode[] = [];

  if (b.zendeskUrl) content.push(paragraph(`Zendesk: ${sanitize(b.zendeskUrl as string)}`));

  const preconditions = b.preconditions as string[] | undefined;
  if (preconditions?.length) content.push(heading('Preconditions'), bulletList(sanitizeList(preconditions)));

  content.push(
    heading('Steps to reproduce'),
    bulletList(sanitizeList(b.stepsToReproduce as string[])),
    heading('Expected outcome'),
    paragraph(sanitize(b.expectedOutcome as string)),
    heading('Actual outcome'),
    paragraph(sanitize(b.actualOutcome as string)),
  );

  if (b.additionalNotes) content.push(heading('Additional notes'), paragraph(sanitize(b.additionalNotes as string)));
  if (b.releaseNotes) content.push(heading('Release notes'), paragraph(sanitize(b.releaseNotes as string)));
  if (b.qa) content.push(heading('QA'), paragraph(sanitize(b.qa as string)));

  return { type: 'doc', version: 1, content };
}

export async function POST(req: Request) {
  const body = await req.json();
  const { issueType } = body;
  const summary = sanitize(body.summary as string);

  try {
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString('base64');

    const description = issueType === 'Bug' ? buildBugADF(body) : buildStoryADF(body);

    const res = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: process.env.JIRA_PROJECT_KEY },
          summary,
          issuetype: { name: issueType },
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
      url: `${process.env.JIRA_BASE_URL}/browse/${data.key}`,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
