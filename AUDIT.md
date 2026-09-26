# AUDIT — Arka Workspace vs Huly checklist

**Date:** 2026-09-23  
**Scope:** current Next.js app at `src/app/ws`, `src/components/workspace`, `src/app/api/workspace`, `src/lib/data/workspace.ts`, Supabase migrations.  
**Not in scope:** public site (blog/video/shop), except where it shares Auth/notifications.

This report compares the **running architecture** to a Huly-class workbench. Visual tokens were recently upgraded; this audit is about **product completeness and correctness**, not look.

---

## 1. Current codebase (stage 1)

**Stack**

| Layer | What is used |
| --- | --- |
| App | Next.js 16 App Router, React 19, Cloudflare OpenNext |
| Data | Supabase Postgres + Auth + Realtime + Storage (`workspace` bucket) |
| Client state | React `useState` / URL search params. No Redux/Zustand. Optimistic patches in `TaskBoard`. |
| Video | Jitsi iframe (`JitsiRoom`) |
| Validation | Zod on workspace API routes; `sanitizeText` |
| Types | Hand-written TS in `src/lib/data/workspace.ts` (not generated from DB) |

**Folder map (workspace)**

```
src/app/ws/                  pages: inbox, tasks, chat, docs, meet, calendar
src/app/api/workspace/       REST: tasks, messages, notes, channels, files, …
src/components/workspace/    UI: Shell, Navigator, TaskBoard, ChatPanel, DocsEditor, …
src/lib/data/workspace.ts    all entity types + list/get queries
src/lib/auth/roles.ts        admin | collaborator | user
src/proxy.ts                 host rewrite + collaborator gate
```

There is **no package-per-feature**. Tracker/Chat/Docs/Office are sibling components that all import the same data file and share one layout fetch in `src/app/ws/layout.tsx`.

**How each feature is implemented**

| Feature | UI | Persistence | Live updates |
| --- | --- | --- | --- |
| Tracker | `TaskBoard.tsx` + `/ws/tasks` | `workspace_tasks`, comments | `postgres_changes` on tasks |
| Chat | `ChatPanel.tsx` + `/ws/chat/[id]` | `workspace_messages`, reactions, storage | INSERT on messages only |
| Documents | `DocsEditor.tsx` + textarea | `workspace_notes` | none |
| Office | `MeetingList` / `MeetingStage` + Jitsi | `workspace_meetings` | Presence channel only |
| Inbox | `InboxFeed.tsx` | derived from tasks + last messages | none (refresh on navigation) |
| Tenants | header `<select>` | cookie `arka_tenant` + `workspace_tenants` | none |

**Roles today:** `user` (site only), `collaborator` and `admin` (full workspace). Tenant member `role` column exists but is **not enforced** in APIs.

---

## 2. Status table

Legend: **done** = کامل و درست · **partial** = ناقص · **missing** = غایب · **bug** = پیاده با باگ · **dup** = تکراری

### Architecture

| Item | Status | Notes |
| --- | --- | --- |
| Modular feature isolation | partial | Separate routes/components, but one shared layout query, one data module, no feature packages. |
| Data layer / entity types | partial | Strong TS types for Issue/Message/Note/Meeting/Project/Tenant. No Contact CRM entity. Zod duplicated per route. |
| Real-time sync | partial / bug | Tasks: INSERT/UPDATE/DELETE live. Chat: INSERT only; author on live rows is `"Teammate"`. Docs/inbox: no sync. |
| Permission / role | partial / bug | Gate is binary collaborator/admin (`canAccessWorkspace`, `is_collaborator` RLS). No Member vs Admin inside a tenant. Cookie tenant is not RLS. |
| Notification engine | partial | In-app bell exists (`WsNotifications` → `/api/notifications`). Triggers are **site** (likes/comments), not issue/chat/mention. |
| Activity / change history | missing | No audit table, no issue changelog, no doc versions. |
| Type-safe API | partial | Zod + TS on server. Client `fetch` is untyped JSON. No OpenAPI / supabase gen types. |
| Multi-workspace | partial / bug | Switcher + cookie + `tenant_id` columns. RLS still `is_collaborator()` for all workspace tables → any collaborator can read/write other tenants. |

### Tracker

| Item | Status | Notes |
| --- | --- | --- |
| Issue CRUD + status/priority/assignee/label | partial | Create/update in UI. PATCH supports due date; **no due-date field in UI**. DELETE API exists; **no delete in UI**. Status is `todo/doing/done` only (no Cancelled). |
| Sub-issues and relations | partial | `parent_id` sub-issues only. No blocks/related/duplicates. |
| Filter, grouping, saved views | partial | URL filters: `view=todo\|doing\|done\|board`, `project=`. No grouping, no saved views, no text search. |
| Sprint / milestone | missing | No tables or UI. |
| Board DnD persisted | done | HTML5 drag to columns → `PATCH status`. |
| Bulk actions | missing | Single-row panel only. |

### Chat

| Item | Status | Notes |
| --- | --- | --- |
| Send/receive real-time | partial / bug | Send + INSERT subscription. Live payload misses profile join; reactions not subscribed. |
| Channels + DM | done | `kind` channel/private/dm; create channel/DM in navigator. |
| Thread / reply / reaction / search | partial | Reply + thread sidebar + emoji. **No message search.** |

### Documents

| Item | Status | Notes |
| --- | --- | --- |
| Create/edit rich text | partial | Title/body textarea, slash menu, markdown-ish markers, attach, link issue. Not a real editor (no Tiptap). |
| Real-time co-editing | missing / bug | Last `PATCH` wins. Two people overwrite each other with no warning. |
| Version history | missing | No revisions table. |

### UI/UX

| Item | Status | Notes |
| --- | --- | --- |
| Empty states | done | Issues/backlog/active/inbox/chat/docs/office/calendar. |
| Loading for async | partial | Spinner on create issue, save doc, invite, create room. Shell data, chat send, board drag have no global pending/skeleton. |
| Responsive | partial | Bottom nav (4 apps) on small screens; navigator `md+`. Board columns stack. Chat thread hidden on small (`hidden md:flex`). |
| Dark/light complete | partial | Tokenized `.ws-app` + `.ws-theme-light`. Jitsi/black stage and some native `<select>`/`<option>` still OS-chrome. |
| Keyboard Search + Create | partial | Ctrl/Cmd+K command palette. **No shortcut to create issue.** |

### Security / stability

| Item | Status | Notes |
| --- | --- | --- |
| Input validation | partial | Backend Zod + sanitize. Frontend almost no schema; file size checked on upload API. |
| Error handling | partial | API `errorResponse`. Root `src/app/error.tsx` is generic Persian site chrome, not workspace. Chat upload `throw` can break the panel. |
| Auth/session | done | `getUser()`, httpOnly cookies, CSRF `assertSameOrigin`, rate limit on mutations, proxy redirects unauthenticated `/ws`. |

---

## 3. Why / where (non-green items)

### Architecture

**Modular isolation — partial**  
`src/app/ws/layout.tsx` always loads channels, inbox, people, tasks, notes, meetings, tenants, projects for every pane. A chat-only visit still queries Tracker. Features cannot ship independently.

**Entity layer — partial**  
Types live in `src/lib/data/workspace.ts`. Zod copies live in each `src/app/api/workspace/*/route.ts`. Drift risk (e.g. note colors, task status). No `Contact` model (Huly CRM not in product; people = `profiles`).

**Real-time — partial + bug**  
- Live tasks: `TaskBoard.tsx` `postgres_changes` `event: "*"`.  
- Live chat: `ChatPanel.tsx` `event: "INSERT"` only (~line 54). Reaction POST does not push to other clients until refresh.  
- Live INSERT maps `author.displayName` to `"Teammate"` if not self (~line 72).  
- Notes/meetings/inbox: no channels.

**Permissions — partial + bug**  
`src/lib/auth/roles.ts` + `requireWorkspace()` on APIs. RLS policies in `supabase/migrations/20260920120000_workspace.sql` and `20260922180000_workspace_full_modules.sql` use `is_collaborator()`, not `workspace_tenant_members`. Switching tenant is a cookie (`arka_tenant` in `tenants/route.ts`), filter in `listTasks()` et al. A collaborator can still query another tenant’s rows via the Data API.

**Notifications — partial**  
`WsNotifications.tsx` reads `/api/notifications`. Inserts happen from site triggers in `supabase/migrations/20260903120000_init.sql` (likes/comments). Assigning an issue or `@mention` in chat does **not** write a notification.

**Activity log — missing**  
No `workspace_activity` (or similar) in migrations. Issue panel has comments, not field history.

**API types — partial**  
Server: Zod. Client: `fetch(...).then(r => r.json())` in TaskBoard/ChatPanel/DocsEditor. No shared contract package.

**Multi-workspace — partial + bug**  
UI switcher in `WorkspaceShell.tsx`. Data filter by cookie. Isolation is **not** cryptographic/RLS. `listTenants` falls back to all tenants on error (`workspace.ts` ~line 95).

### Tracker

**CRUD — partial**  
`src/app/api/workspace/tasks/route.ts` has POST/PATCH/DELETE. `TaskBoard.tsx` never calls DELETE; never binds `dueAt`. Labels are a comma text field, not a label catalog.

**Relations — partial**  
Sub-issue form posts `parentId`. No `blocks` / `related`.

**Filters — partial**  
`HulyNavigator.tsx` links `?view=` and `?project=`. No assignee/priority/label filters, no persist.

**Sprint — missing**  
No schema.

**Bulk — missing**  
No multi-select on the table.

### Chat

**Realtime quality — bug**  
See INSERT-only + fake author above.

**Search — missing**  
Command palette searches **titles** of channels/tasks, not message bodies. No `/api/workspace/messages?q=`.

### Documents

**Rich text — partial**  
`DocsEditor.tsx` is a `<textarea>`. Bold/italic wrap the **whole** body. Slash inserts markdown prefixes. Fine as notes; not Huly documents.

**Co-edit — missing (unsafe if two editors)**  
PATCH replaces `body`. No `updated_at` check, no CRDT/Yjs.

**History — missing**

### UI

**Loading — partial**  
Spinners on a few buttons. Layout `Promise.all` has no skeleton. Chat send has no pending state.

**Responsive — partial**  
`WorkspaceShell` bottom nav drops Calendar/Office. Thread column `hidden md:flex` in `ChatPanel.tsx`.

**Theme — partial**  
Tokens cover chrome. Native inputs and Jitsi are outside the token set.

**Shortcuts — partial**  
`CommandPalette.tsx` Ctrl+K. Create issue is mouse/form only.

### Security

**Validation — partial**  
APIs are decent. Client does not validate UUID/priority before PATCH.

**Errors — partial**  
`src/app/error.tsx` is site-styled, not `ws-app`. `ChatPanel` `uploadFile` throws. Task PATCH errors are ignored (optimistic UI stays wrong).

**Auth — done** for “must be logged-in collaborator”. Not done for tenant-scoped authorization.

### Redundant (`dup`)

| What | Where | Why |
| --- | --- | --- |
| Icon set | `src/components/workspace/ws-icons.tsx` | Unused after lucide-react. |
| i18n dictionaries | `src/lib/workspace/copy.ts` vs `i18n.ts` | `i18n.ts` is unused; copy.ts is live. |
| Design tokens | `design-tokens.json` + `docs/tokens.json` + CSS in `globals.css` | JSON is documentation; CSS is source of truth. |
| Data fallbacks | `listMessages` / `listNotes` try full select then skinny select | Survival for old schema; hides missing columns in prod. |
| `requireWorkspace()` copy | every `api/workspace/*/route.ts` | Same 8-line helper pasted. |

---

## 4. Priority (what to fix first)

Do **not** start these until you pick a track. Ordered by risk and product gap.

### Critical

1. **Tenant RLS** — policies must require membership in `workspace_tenant_members` for the row’s `tenant_id`. Cookie-only filter is not a security boundary.  
2. **Chat live correctness** — subscribe to reactions (or refetch); send author profile on INSERT (trigger or follow-up select).  
3. **Workspace notifications** — at least: assigned issue, chat `@mention`, DM. Reuse `notifications` table with new `type` values.  
4. **Docs conflict** — either lock/warning (`updated_at`) or don’t call it co-editing. Current last-write-wins will lose notes.

### Important

5. **Issue completeness** — delete in UI, due date, Cancelled (or archive), label catalog.  
6. **Tracker views** — assignee/priority/label filter; persist as saved view (table or user prefs).  
7. **Chat search** — query `workspace_messages.body` with tenant/channel scope.  
8. **Activity log** — append-only events on task PATCH (status/assignee).  
9. **Keyboard Create** — `C` / `N` focused on Tracker.  
10. **Error UX** — `src/app/ws/error.tsx`; don’t throw in ChatPanel upload; revert optimistic PATCH on failure.  
11. **Per-tenant roles** — owner vs member using `workspace_tenant_members.role`.  
12. **Issue relations** beyond parent (optional graph table).

### Nice-to-have

13. Sprint/milestone entities.  
14. Bulk issue actions.  
15. Real collaborative editor (Yjs) + version history.  
16. Split data layer into feature modules / generated DB types.  
17. Delete dead `ws-icons.tsx` and `i18n.ts`.  
18. Message pagination (hard 80-message cap in `listMessages`).

---

## 5. Intentionally out of Huly

These are **not** bugs relative to the product decisions already made:

- No CRM / HR / ATS.  
- Video is Jitsi, not a custom SFU.  
- Docs are notes, not a full ProseMirror port.  
- Public creator site remains a separate IA under `/` vs `/ws`.

---

Waiting on which track to implement first. No code was changed in this pass.
