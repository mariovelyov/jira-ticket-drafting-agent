export async function POST(req: Request) {
  const { summary, description, issueType, acceptanceCriteria } = await req.json();

  try {
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString('base64');

    const acCriteria: string[] = acceptanceCriteria ?? [];

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
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: description }],
              },
              ...(acCriteria.length > 0
                ? [
                    {
                      type: 'bulletList',
                      content: acCriteria.map((c: string) => ({
                        type: 'listItem',
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: c }],
                          },
                        ],
                      })),
                    },
                  ]
                : []),
            ],
          },
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
