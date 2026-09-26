# CHANGELOG — workspace vs Huly

## Reimplemented (this repo)

| Area | Implementation | Original Huly |
| --- | --- | --- |
| Shell | `src/components/workspace/WorkspaceShell.tsx` | Platform workbench / navigator (not copied) |
| Chat | `ChatPanel.tsx`, `MessagesRail.tsx`, Supabase Realtime | Communication plugin |
| Tracker | `TaskBoard.tsx` HTML5 drag/drop kanban | Tracker / issues |
| Docs-lite | `DocsEditor.tsx` + `workspace_notes.body` | Documents |
| Meet | Jitsi iframe (`JitsiRoom.tsx`) instead of P2P mesh | Love / video |
| i18n | `src/lib/workspace/i18n.ts` en + fa | Platform i18n |
| Command palette | `CommandPalette.tsx` Ctrl/Cmd+K | Action / command |

## Copied from Huly

None. No file paths or commit SHAs from `hcengineering/platform` were imported.

## Analysis commands (not run in this environment as a full clone)

```bash
git clone https://github.com/hcengineering/platform.git
cd platform
git rev-parse --abbrev-ref HEAD   # expected: develop
ls
```

`huly-selfhost` docker-compose was not started here (heavy infra + no live capture). See ERRORS_AND_LIMITATIONS.md.
