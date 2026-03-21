# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, Claude generates code via tool calls, and a sandboxed iframe renders the result in real-time using an in-memory virtual file system.

## Commands

```bash
npm run setup          # Install deps, generate Prisma client, run migrations
npm run dev            # Start dev server (Turbopack) on localhost:3000
npm run build          # Production build
npm run lint           # ESLint
npm run test           # Vitest (all tests)
npx vitest run <file>  # Run a single test file
npm run db:reset       # Reset database (destructive)
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already configured in scripts).

## Tech Stack

- Next.js 15 (App Router) / React 19 / TypeScript
- Tailwind CSS v4 with shadcn/ui (new-york style, `@/components/ui/`)
- Prisma + SQLite (`prisma/schema.prisma`)
- Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) for streaming chat
- Monaco Editor for code editing
- Babel standalone for JSX transformation in the browser
- Vitest + React Testing Library + jsdom

## Architecture

### Core Data Flow

```
User message → ChatContext → /api/chat → AI model (with tools) → tool calls
  → VirtualFileSystem updates → FileSystemContext → UI re-renders
  → PreviewFrame: JSX Transformer → import map → sandboxed iframe
```

### Key Subsystems

**AI Chat Endpoint** (`src/app/api/chat/route.ts`): Streams AI responses with up to 40 tool-call steps. Two AI tools are available: `str_replace_editor` (create/edit/view files) and `file_manager` (rename/delete). On completion, saves messages and file system state to the database.

**LLM Provider** (`src/lib/provider.ts`): Uses Claude Haiku 4.5 when `ANTHROPIC_API_KEY` is set; falls back to a `MockLanguageModel` that returns deterministic component patterns.

**Virtual File System** (`src/lib/file-system.ts`): In-memory tree structure with create/read/update/delete/rename. Serializable for database persistence. No files are written to disk.

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Babel transpiles JSX/TSX → JS, builds an import map (external libs → esm.sh CDN, internal files → blob URLs), and injects CSS.

**Live Preview** (`src/components/preview/PreviewFrame.tsx`): Renders the entry point (`/App.jsx` or `/index.jsx`) in a sandboxed iframe that auto-updates on file system changes.

**Auth** (`src/lib/auth.ts`): JWT sessions stored in HTTP-only cookies (jose library). Middleware protects API routes. Anonymous users can work without signing in; their work migrates on sign-up/sign-in.

### State Management

Two React contexts wrap the app:
- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`): Manages VFS instance, selected file, and processes AI tool call responses.
- **ChatContext** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat`, passes serialized file system to the chat API.

### App Router Structure

- `/` — Home page; redirects authenticated users to their most recent project
- `/[projectId]` — Project page (requires auth), loads project from DB
- `/api/chat` — AI streaming endpoint

### Database Models

- **User**: email, bcrypt password
- **Project**: name, userId, messages (JSON), data (JSON containing serialized VFS)

### System Prompt

Defined in `src/lib/prompts/generation.tsx`. Key rules: every project must have root `/App.jsx`, style with Tailwind CSS, use `@/` alias for internal imports.

## Path Aliases

`@/` maps to `src/` (configured in tsconfig.json and components.json).
