# Handover

**Product:** Arka Workspace at https://workspace.arkasalehi.com  
**Stack:** Next.js App Router, Supabase Auth/Postgres/Realtime, Jitsi for video  
**License vs Huly:** EPL-2.0 inspiration only — see LICENSE-AUDIT.md

## Deploy checklist

1. Collaborators have `profiles.role` in (`collaborator`, `admin`).
2. Env: `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_WORKSPACE_URL`, `COOKIE_DOMAIN=.arkasalehi.com`.
3. Migrations in `supabase/migrations/` applied (including `20260922160000_workspace_notes_body.sql`).
4. Realtime publication includes `workspace_messages`, `workspace_tasks`.
5. `npm run build` / Cloudflare OpenNext deploy as in DEPLOY.md.

## Demo checklist

- Login on main site → open workspace host
- Ctrl/K jump to Tracker / Chat / Docs
- Create issue, drag across columns, assign a person
- Send chat message, react, convert message → task
- Create a doc and save
- Create meeting and join Jitsi (camera/mic)
- Toggle FA for RTL strings
- Mark notifications read

## Tokens

See `src/lib/workspace/design-tokens.json`.

## Storybook

Not in this repo. Local UI is the app itself: `npm run dev` then open the workspace URL.
