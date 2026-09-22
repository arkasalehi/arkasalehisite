# Architecture — Arka Workspace

Host: `workspace.arkasalehi.com` (rewrites `/` → `/ws` via `src/proxy.ts`). Collaborator or admin role required (`is_collaborator`).

```
[Browser]
  WorkspaceShell (rail + navigator + pane)
    Chat  → Supabase Realtime workspace_messages
    Tasks → workspace_tasks (+ comments)
    Docs  → workspace_notes
    Meet  → workspace_meetings + Jitsi iframe
    Notify → notifications table
[Supabase] Postgres + Auth + Realtime
[Main site] arkasalehi.com (shared cookie domain)
```

## Routes

| Path | Title | Component |
| --- | --- | --- |
| `/ws` | Home | `src/app/ws/page.tsx` |
| `/ws/tasks` | Tracker | `TaskBoard` |
| `/ws/chat`, `/ws/chat/[channelId]` | Chat | `ChatPanel` |
| `/ws/docs`, `/ws/docs/[id]` | Docs-lite | `DocsEditor` |
| `/ws/meet`, `/ws/meet/[id]` | Meetings | `MeetingList` / `MeetingStage` |
| `/ws/calendar` | Calendar | `src/app/ws/calendar/page.tsx` |

## APIs

- `POST /api/workspace/messages`
- `POST /api/workspace/reactions`
- `POST|PATCH|DELETE /api/workspace/tasks`
- `GET|POST /api/workspace/comments`
- `POST|PATCH /api/workspace/notes`
- `POST /api/workspace/meetings`
- `GET|POST /api/notifications`

## Swap chat backend

`ChatPanel` and `listMessages` are the seam. Replace fetch + `postgres_changes` with a socket.io client; keep the `WorkspaceMessage` type.

## DB (simplified)

users/`profiles`, `workspace_channels`, `workspace_messages`, `workspace_reactions`, `workspace_tasks`, `workspace_task_comments`, `workspace_notes`, `workspace_meetings`, `notifications`.
