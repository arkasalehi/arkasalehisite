# Deploy: Cloudflare Workers (OpenNext) + Node fallback

This app stays portable. **Local and self-hosted Node use `next start`.** Cloudflare uses `@opennextjs/cloudflare`, which runs the same Next.js App Router (including `/api/*`) inside a Worker with `nodejs_compat`.

Do **not** deploy the raw `.next` folder as a static Pages site. That drops SSR and API routes. OpenNext runs `next build`, then emits `.open-next/` (Worker + assets). Wrangler deploys `.open-next/`, never `.next`.

---

## What went wrong

Cloudflare Git builds were set to:

```
Build command:  npm run build
Deploy command: npx wrangler deploy
```

`npm run build` is **only** `next build`. It produces `.next`. Wrangler then detects OpenNext and runs `opennextjs-cloudflare deploy`, which needs `.open-next/` (`Could not find compiled Open Next config`).

`--skipNextBuild` after a plain `next build` also fails: OpenNext needs standalone output (`.next/standalone`) that only exists when **OpenNext** invokes Next (`NEXT_PRIVATE_STANDALONE`).

**Fix:** Cloudflare **Build command** must be `npx opennextjs-cloudflare build`. That script calls `npm run build` (`next build`) internally, then writes `.open-next/`.

---

## Exact Cloudflare dashboard settings

Worker → **Settings** → **Build**:

| Field | Value |
| --- | --- |
| Framework preset | Next.js (OpenNext) |
| **Build command** | `npx opennextjs-cloudflare build` |
| **Deploy command** | `npx wrangler deploy` |
| Root directory | `/` (repo root) |
| Output directory | **leave empty** — do not set `.next` |

If Build command is still `npm run build`, change it before the next deploy. The repo cannot override this dashboard field.

---

## Environment variables

**Settings → Variables and Secrets.** Mark **Build** vs **Runtime** as below.

| Name | Build | Runtime | Value |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | **yes** | yes | Canonical origin, e.g. `https://arkasalehi.ir` (inlined at build) |
| `NEXT_PUBLIC_SUPABASE_URL` | **yes** | yes | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **yes** | yes | Publishable/anon key |

Optional: `NEXT_PUBLIC_SITE_URL` (alias of base URL), `NEXT_PUBLIC_SITE_NAME`, `COOKIE_DOMAIN`.

`NEXT_PUBLIC_*` must exist at **build** time. Changing the public URL requires a rebuild.

Workers talk to Supabase over HTTPS (`@supabase/supabase-js`). Apply `supabase/migrations/20260903120000_init.sql` in the Supabase SQL editor before first use.

Auth cookies are managed by `@supabase/ssr` (`httpOnly`, `SameSite=lax`, `Secure` in production).

---

## Local Node

```bash
cp .env.example .env
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
npm install
npm run dev
```

Production Node:

```bash
npm run build
npm start
```

---

## CLI (Wrangler)

```bash
cp .dev.vars.example .dev.vars
npx wrangler login
npm run cf:build
npm run cf:deploy
```

Preview the Worker (not `next dev`):

```bash
npm run preview
```

Optional GitHub Action: `.github/workflows/deploy-cloudflare.yml`  
Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
Vars: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`.

---

## Clean reinstall

```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules, .next, .open-next -ErrorAction SilentlyContinue
npm install

# macOS / Linux
rm -rf node_modules .next .open-next
npm install
```

Then either `npm run dev` (Node) or `npm run cf:build` (OpenNext).

---

## After deploy — checks

- `GET /` → 200
- `GET /blog` → 200
- `GET /login` → 200
- `GET /api/posts` → JSON
- Login → session cookies from Supabase (`sb-*-auth-token`), `Secure; HttpOnly; SameSite=Lax`
- Refresh the page: session persists
- `GET /manifest.webmanifest` and `GET /sw.js` → 200
- Custom domain: same checks over HTTPS

---

## What not to do

- Do not set Cloudflare Build command to `npm run build`.
- Do not set output directory to `.next`.
- Do not set `export const runtime = "edge"` — OpenNext uses **Node.js** on `workerd`.
- Do not import `cloudflare:` / KV / D1 / R2 in `src/` (bindings stay in `wrangler.jsonc`).
- Do not use `@cloudflare/next-on-pages` (deprecated).
- Image Resizing is off (`images.unoptimized = true`) so deploy does not require an `IMAGES` binding.
