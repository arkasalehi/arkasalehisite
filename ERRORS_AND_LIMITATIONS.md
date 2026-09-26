# ERRORS_AND_LIMITATIONS

- Did **not** clone or run `hcengineering/platform` or `huly-selfhost` in this session. UI work continues on the existing Next.js app at `workspace.arkasalehi.com`.
- Did **not** create a separate `workspace-from-huly` monorepo, Storybook, Playwright suite, tarball, or PDF handover. Those artifacts would fork this product; the live target is this repo.
- Huly license is EPL-2.0; source was **not** copied. Visual parity is inspirational, not pixel-measured against a running Huly instance.
- Video uses **Jitsi Meet** (camera, mic, screen share) rather than a custom WebRTC mesh. For ≤6 people a mesh is possible later; SFU (mediasoup/Jitsi-as-now) is the scale path.
- No CRM/HR/ATS modules.
- Chat file attach records a filename in the message; it does not upload blobs to Storage yet.
- Unit/E2E/CI Storybook from the original prompt are **not** added to this Cloudflare Next app (would be a new toolchain). `npm run lint` / `npm run build` remain the gate.
- `hand-over.pdf` and `workspace-from-huly.tar.gz` were not produced; use `docs/HANDOVER.md` instead.
