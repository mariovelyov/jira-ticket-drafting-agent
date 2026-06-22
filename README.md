# Jira Ticket Drafting Agent

A streaming chat app that turns plain-English bug/feature descriptions into structured Jira tickets. Describe a problem, review and edit the AI-drafted fields, then create a real Jira issue with one click.

Built with Next.js 16, AI SDK v6, and the Jira Cloud REST API. Portfolio project demonstrating a human-in-the-loop AI architecture.

## How it works

1. Type a bug or feature description in the chat
2. The model calls `draftStory` or `draftBug` depending on what you described
3. An editable card appears with all structured fields pre-filled
4. Edit any field, then click **Create in Jira** to create a real issue

The model never creates a Jira ticket directly - it only structures the data. Creation always requires an explicit user action.

## Ticket formats

**Stories** follow the 3W format: Problem this solves, Who/What/Why, Acceptance Criteria ("As a [role] can I ...?"), Dependencies, Risks, UX, Analytics, Release notes, QA.

**Bugs** follow: Zendesk link, Preconditions, Steps to reproduce, Expected outcome, Actual outcome, Additional notes, Release notes, QA.

## Stack

- [Next.js 16](https://nextjs.org) - App Router, streaming API routes
- [AI SDK v6](https://sdk.vercel.ai) - `streamText`, `useChat`, tool calling
- [Anthropic](https://anthropic.com) - claude-haiku-4-5 by default (configurable)
- [Jira Cloud REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) - issue creation with ADF formatting
- [Tailwind CSS v4](https://tailwindcss.com)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/mariovelyov/jira-ticket-drafting-agent
cd jira-ticket-drafting-agent
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `ANTHROPIC_MODEL` | optional - defaults to `claude-haiku-4-5` |
| `JIRA_BASE_URL` | your Atlassian site URL, e.g. `https://yoursite.atlassian.net` |
| `JIRA_EMAIL` | the email on your Atlassian account |
| `JIRA_API_TOKEN` | [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_PROJECT_KEY` | the key of your Jira project (e.g. `DEMO`) |

> **Note:** Point `JIRA_BASE_URL` at a personal sandbox only - never a work Jira instance.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Switching models

Set `ANTHROPIC_MODEL` in `.env.local` to any Anthropic model ID:

```
ANTHROPIC_MODEL=claude-sonnet-4-6
```

No code change needed. Omit the variable to use the default (`claude-haiku-4-5`).

## Project structure

```
app/
  api/
    chat/route.ts          # streaming POST - runs streamText with draftStory and draftBug tools
    create-ticket/route.ts # plain POST - builds ADF and calls Jira REST API
  components/
    StoryCard.tsx          # editable card for story tickets
    BugCard.tsx            # editable card for bug tickets
  page.tsx                 # chat UI
lib/
  tools/
    draftStory.ts          # story tool (pure passthrough, no side effects)
    draftBug.ts            # bug tool (pure passthrough, no side effects)
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all env vars from `.env.example` in the Vercel project settings
4. Deploy

The most common reason a working-locally build breaks in production is missing env vars in Vercel - double-check all six are set.
