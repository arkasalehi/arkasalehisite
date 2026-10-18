# Theming

Tokens live in `src/lib/workspace/design-tokens.json` (also copied conceptually to this doc).

## Colors

- Studio accent `#3ecf8e` on a neutral dark scale (`#171717` sidebar, `#1c1c1c` canvas, `#ededed` text). Light mode uses the same green family on `#fafafa`.
- Public site tokens live in `src/app/globals.css` (`--brand`, `--bg`, `--fg`). Workspace tokens are the `--ws-*` and `--theme-*` variables on `.ws-app`.
- Motion is 200ms with `cubic-bezier(0.22, 1, 0.36, 1)`.

## Fonts

Persian stays on Vazirmatn (`--font-vazir`). Latin UI uses Manrope (`--font-manrope`). Code and shortcuts use Source Code Pro (`--font-source`). The stack is `Manrope, Vazirmatn`, so missing glyphs fall through per character and RTL copy stays readable.

## RTL

Toggle **FA / EN** on the left rail (`localStorage` key `ws-locale`). `dir` is set on `.ws-app`.

## Remove a module

Delete the nav item in `WorkspaceShell.tsx`, the route under `src/app/ws/<module>`, and optional API under `src/app/api/workspace`.
