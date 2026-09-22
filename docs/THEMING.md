# Theming

Tokens live in `src/lib/workspace/design-tokens.json` (also copied conceptually to this doc).

## Colors

- Primary `#2F6BFF`, canvas `#F7F8FB`, border `#EEF1F6`, text `#1E293B`, muted `#8B95A5`.
- Change the hex values in that JSON and in `globals.css` (`.ws-app-sky`, `.ws-window`) plus hardcoded `#2F6BFF` classes in workspace components.

## Fonts

Workspace inherits Vazirmatn (`--font-vazir`) so Persian RTL stays readable. English uses system UI.

## RTL

Toggle **FA / EN** on the left rail (`localStorage` key `ws-locale`). `dir` is set on `.ws-app`.

## Remove a module

Delete the nav item in `WorkspaceShell.tsx`, the route under `src/app/ws/<module>`, and optional API under `src/app/api/workspace`.
