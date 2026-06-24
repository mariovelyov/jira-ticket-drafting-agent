# Jira Ticket Drafting Agent

A streaming chat app: user describes a bug/feature in plain English -> LLM drafts a structured Jira ticket -> user reviews and clicks a button to create a real issue via the Jira Cloud REST API. Portfolio piece targeting Vercel Hobby tier.

## Critical design decisions - do not change

- **The LLM never creates the ticket directly.** `draftStory` and `draftBug` are pure passthrough tools - they only structure fields, no side effects. Ticket creation is a plain button click hitting `/api/create-ticket` - a separate, non-AI route. This human-in-the-loop boundary is the main interview talking point; preserve it.
- **Jira target is a personal sandbox only.** Never point `JIRA_BASE_URL` at a work Jira instance.

## Stack / version notes

Using **AI SDK v6** - these v4/v5 patterns are wrong, don't use them:

| Wrong (old) | Correct (v6) |
|---|---|
| `import { useChat } from 'ai/react'` | `import { useChat } from '@ai-sdk/react'` |
| `parameters: z.object(...)` in tool | `inputSchema: z.object(...)` |
| `useChat` manages input state | manage input with `useState` yourself |
| `messages: convertToModelMessages(messages)` | `messages: await convertToModelMessages(messages)` - it's async |
| `useChat({ api: '/api/chat' })` | `useChat()` - `api` option removed; default is `/api/chat`; use `transport: new DefaultChatTransport({ api: '...' })` for a custom endpoint |

Tool call UI parts are typed as `tool-<toolName>` (e.g. `tool-draftStory`, `tool-draftBug`) with a `state` field cycling: `input-streaming` -> `input-available` -> `output-available` (or `output-error`).

TypeScript won't auto-narrow a tool part after checking `part.type` - cast explicitly with `part as any`.

## Ticket formats

**Story sections** (in order): summary, Problem this solves, 3W (Who/What/Why), Acceptance Criteria ("As a [role] can I ...?"), Dependencies/Limitations, Risks/Security/Threats, UX, Analytics, Release notes, QA.

**Bug sections** (in order): summary, Zendesk URL (optional), Preconditions, Steps to reproduce, Expected outcome, Actual outcome, Additional notes, Release notes, QA.

ADF is built server-side in `/api/create-ticket` from structured fields - the LLM never produces markup.

## Project structure conventions

- Tools live in `lib/tools/<toolName>.ts`, one file per tool - not inline in the route.
- Card components live in `app/components/` - one per issue type (`StoryCard.tsx`, `BugCard.tsx`).
- Shared list input lives in `app/components/ListEditor.tsx`.
- Tool call rendering lives in `app/components/ToolCard.tsx` (state machine: streaming/error/available).
- Draft state and ticket creation logic live in `app/hooks/useDrafts.ts`.
- The model ID is read from `process.env.ANTHROPIC_MODEL` with a `claude-haiku-4-5` default - never hardcode a model name.
- Issue types are `'Bug'` and `'Story'` only.

## Security measures implemented

These were added after a security audit. Do not remove them.

- **Bearer token auth** - both API routes check `Authorization: Bearer $API_SECRET_TOKEN` via `lib/auth.ts`. Auth is skipped if `API_SECRET_TOKEN` is not set (local dev). Add the env var in Vercel settings for production.
- **Input limits** - `/api/chat` rejects requests with >50 messages or any message part exceeding 10,000 characters.
- **JIRA_BASE_URL validation** - validated at request time against `^https://[...].atlassian.net$` to prevent SSRF. Also enforces HTTPS for credentials in transit.
- **Error message sanitization** - Jira API error bodies are logged server-side only; generic messages are returned to the client. UI caps displayed error strings at 120 characters.
- **Security headers** - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a CSP are set in `next.config.ts` for all routes.
- **Prompt injection guard (Layer 1)** - system prompt explicitly instructs the model to treat user messages as data only.
- **HTML sanitization (Layer 4)** - all string fields are stripped of HTML tags before ADF construction in `/api/create-ticket`.

## Environment variables

All in `.env.local` locally; add to Vercel project settings before deploying.

| Variable | Notes |
|---|---|
| `ANTHROPIC_API_KEY` | dedicated key for this project only |
| `ANTHROPIC_MODEL` | optional - model ID to use; defaults to `claude-haiku-4-5` |
| `JIRA_BASE_URL` | `https://<your-site>.atlassian.net` - no trailing slash, validated at runtime |
| `JIRA_EMAIL` | email used for the Jira sandbox account |
| `JIRA_API_TOKEN` | classic (unscoped) API token |
| `JIRA_PROJECT_KEY` | `DEMO` |
| `API_SECRET_TOKEN` | bearer token required by both API routes in production; omit to disable auth locally |

## Deployment

- **Live URL:** https://jira-ticket-drafting-agent.vercel.app
- Hosted on Vercel Hobby tier - every push to `main` triggers an automatic redeploy.
- Vercel project: `jira-ticket-drafting-agent` under mario-velyov-s-projects.

### ANTHROPIC_API_KEY - disabled by default

The Anthropic API key in Vercel is **disabled when not in active use** to prevent quota drain. Before testing or doing a demo, re-enable it:

1. Go to Vercel → project → Settings → Environment Variables
2. Find `ANTHROPIC_API_KEY` and enable it (or add the value if removed)
3. Trigger a redeploy: push a trivial commit or redeploy manually from the Deployments tab
4. After the session, disable it again

The app will return an error from `/api/chat` if the key is missing - this is expected when disabled.

## Out of scope

- No persistence - chat history resets on refresh, that's fine.
- Anthropic only, no multi-provider switching.
- No rate limiting - Vercel Hobby cold starts make in-memory counters useless; bearer token auth is the primary abuse mitigation.
