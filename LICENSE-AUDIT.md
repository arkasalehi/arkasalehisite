# LICENSE-AUDIT

## Huly / hcengineering/platform

- **License:** Eclipse Public License 2.0 (EPL-2.0)
- **Repo:** https://github.com/hcengineering/platform (default branch `develop`)
- **Companion:** https://github.com/hcengineering/huly-selfhost (run/docker scripts)

EPL-2.0 is a **weak file-level copyleft**. You may use the software commercially. If you **distribute modified copies of EPL-covered source files**, those files (and typically their modifications) must stay under EPL-2.0. Code written independently that merely reimplements UX is not an EPL derivative.

## Re-use decision for arkasalehi

**Do not copy Huly source verbatim** into this repository (avoids mixing EPL files with this app’s license and avoids NOTICE/header obligations on copied files).

This workspace (`workspace.arkasalehi.com`) reimplements Huly **workbench chrome** (app rail, navigator, tracker list/board, chunter-style chat, documents, office rooms) using tokens from `packages/theme/styles/_colors.scss` and `_lumia-colors.scss` on `develop`. Svelte sources were **not** vendored.

Removed custom messenger UI (rounded sky window, iMessage bubbles, bottom candy nav).

## Attribution requirements

- Mention Huly / Hardcore Engineering as inspiration in product docs (this file + CHANGELOG).
- Do **not** claim to be Huly or reuse Huly trademarks as the product name.
- If a future change **does** copy EPL files: keep copyright headers, ship the EPL text, and list those files in COPYRIGHTS_AND_ATTRIBUTIONS.md.

## TODO if copying EPL code later

1. Preserve original copyright headers on each copied file.
2. Add `LICENSE-EPL-2.0.txt` (full EPL text).
3. File-level list: path + upstream SHA.
4. Distribute those files under EPL-2.0.
