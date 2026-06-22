# Jira Ticket Drafting Agent

A streaming chat app: user describes a bug/feature in plain English → LLM drafts a structured Jira ticket → user reviews and clicks a button to create a real issue via the Jira Cloud REST API. Portfolio piece targeting Vercel Hobby tier.

## Critical design decisions — do not change

- **The LLM never creates the ticket directly.** The `draftTicket` tool only structures fields (pure passthrough, no side effects). Ticket creation is a plain button click hitting `/api/create-ticket` — a separate, non-AI route. This human-in-the-loop boundary is the main interview talking point; preserve it.
- **Jira target is a personal sandbox only.** Never point `JIRA_BASE_URL` at a work Jira instance.

## Stack / version notes

Using **AI SDK v6** — these v4/v5 patterns are wrong, don't use them:

| Wrong (old) | Correct (v6) |
|---|---|
| `import { useChat } from 'ai/react'` | `import { useChat } from '@ai-sdk/react'` |
| `parameters: z.object(...)` in tool | `inputSchema: z.object(...)` |
| `useChat` manages input state | manage input with `useState` yourself |
| `messages: convertToModelMessages(messages)` | `messages: await convertToModelMessages(messages)` — it's async |
| `useChat({ api: '/api/chat' })` | `useChat()` — `api` option removed; default is `/api/chat`; use `transport: new DefaultChatTransport({ api: '...' })` for a custom endpoint |

Tool call UI parts are typed as `tool-<toolName>` (e.g. `tool-draftTicket`) with a `state` field cycling: `input-streaming` → `input-available` → `output-available` (or `output-error`).

TypeScript won't auto-narrow a tool part from `message.parts` after checking `part.type === 'tool-draftTicket'` — cast it explicitly: `part as any` or `part as Extract<typeof part, { type: 'tool-draftTicket' }>`.

## Environment variables

All in `.env.local` locally; add to Vercel project settings before deploying.

| Variable | Notes |
|---|---|
| `ANTHROPIC_API_KEY` | dedicated key for this project only |
| `ANTHROPIC_MODEL` | optional — model ID to use; defaults to `claude-haiku-4-5` |
| `JIRA_BASE_URL` | `https://<your-site>.atlassian.net` — no trailing slash |
| `JIRA_EMAIL` | email used for the Jira sandbox account |
| `JIRA_API_TOKEN` | classic (unscoped) API token |
| `JIRA_PROJECT_KEY` | `DEMO` |

## Project structure conventions

- Tools live in `lib/tools/<toolName>.ts`, one file per tool — not inline in the route.
- The model ID is read from `process.env.ANTHROPIC_MODEL` with a `claude-haiku-4-5` default — never hardcode a model name.
- Issue types are `'Bug' | 'Story'` (not `'Task'`).

## Out of scope

- No persistence — chat history resets on refresh, that's fine.
- Anthropic only, no multi-provider switching.
- No retry/rate-limit handling — this is a demo, not production software.
