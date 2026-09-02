# Deploy: Cloudflare Workers (OpenNext) + Node fallback

This app stays portable. **Local and self-hosted Node use `next start`.** Cloudflare uses `@opennextjs/cloudflare`, which runs the same Next.js App Router (including `/api/*`) inside a Worker with `nodejs_compat`.

Do not deploy the raw `.next` folder as a static Pages site. That would drop SSR and API routes. OpenNext builds `.next`, then emits `.open-next/` (Worker + assets).

---

## 1. Local Node (unchanged)

```bash
cp .env.example .env
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Production Node:

```bash
npx prisma migrate deploy
npm run build
npm start
```

---

## 2. Database on Cloudflare

Workers cannot open a durable TCP pool to Postgres. Use **Prisma Accelerate** (HTTP) at runtime:

1. Enable Accelerate on the Prisma Data Platform for your Postgres database.
2. Set **runtime** secret `PRISMA_ACCELERATE_URL` (or `DATABASE_URL`) to the `prisma://…` URL.
3. Keep a real `postgresql://…` URL for **migrations** (run locally or in CI — not on the Worker):

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

`src/lib/db/client.ts` picks Accelerate when the URL starts with `prisma://` / `prisma+postgres://`, otherwise the native Prisma engine (Node).

Never put connection strings in source control.

---

## 3. Environment variables

Set these in **Cloudflare dashboard → Worker → Settings → Variables and Secrets**.

| Name | Build | Runtime | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes (generate) | yes if no Accelerate URL | `postgresql://` for Node; `prisma://` OK if Accelerate-only |
| `PRISMA_ACCELERATE_URL` | optional | **yes on CF** | `prisma://…` HTTP |
| `JWT_SECRET` | no | **yes** | long random string |
| `NEXT_PUBLIC_BASE_URL` | **yes** | yes | canonical origin, e.g. `https://arkasalehi.ir` |
| `NEXT_PUBLIC_SITE_URL` | optional | optional | alias of `BASE_URL` |
| `NEXT_PUBLIC_SITE_NAME` | optional | optional | |
| `COOKIE_DOMAIN` | no | optional | only if cookies must span a parent domain |

`NEXT_PUBLIC_*` is inlined at **build** time. Changing the public URL requires a rebuild.

Auth cookies: `httpOnly`, `SameSite=lax`, `Secure` when `NODE_ENV=production`, host-only unless `COOKIE_DOMAIN` is set.

---

## 4. Cloudflare GitHub integration (recommended)

1. Push this repo to GitHub.
2. [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Workers** → Connect GitHub.
3. Framework preset: **Next.js** (OpenNext).
4. **Build command** (either works):
   - Preferred: `npx opennextjs-cloudflare build`
   - Also OK: `npm run build` — on Workers CI this runs Next.js, then OpenNext (`--skipNextBuild`) so `.open-next/` exists before Wrangler deploys.
5. **Deploy command:** `npx wrangler deploy`  
   Wrangler detects OpenNext and calls `opennextjs-cloudflare deploy`. That **fails** if the build step only produced `.next` (`Could not find compiled Open Next config`).
6. Do **not** set output directory to `.next`.
7. Add the env vars above. `NEXT_PUBLIC_*` must be present at **build** time. Runtime on Workers needs `PRISMA_ACCELERATE_URL` (`prisma://…`) and `JWT_SECRET`.
8. Deploy. Custom domain: Worker → **Custom Domains** → add `arkasalehi.ir` / `www`.

App Router routes (`/blog/[slug]`, `/video/[slug]`, `/shorts/[slug]`, `/product/[slug]`) are handled by the Worker. No extra `_routes.json` is required.

### Dashboard mistake this repo already hit

```
Executing user build command: npm run build     → next build (OK)
Executing user deploy command: npx wrangler deploy
ERROR Could not find compiled Open Next config
```

Cause: `npm run build` used to stop at Next.js. Wrangler then ran OpenNext **deploy** without an OpenNext **build**. Local `npm run build` is still Next-only; Workers CI (`WORKERS_CI=1`) appends `opennextjs-cloudflare build --skipNextBuild`.

---

## 5. CLI deploy

```bash
cp .dev.vars.example .dev.vars
npx wrangler login
npm run cf:deploy
```

Preview the Worker runtime locally (not the same as `next dev`):

```bash
npm run preview
```

Optional GitHub Action: `.github/workflows/deploy-cloudflare.yml`  
Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL`, `PRISMA_ACCELERATE_URL`, `JWT_SECRET`.  
Vars: `NEXT_PUBLIC_BASE_URL`.

---

## 6. After deploy — checks

- `GET /` → 200
- `GET /blog` → 200
- `GET /api/posts` → JSON
- Login → `as_access` (15m) + `as_refresh` (30d) cookies, `Secure; HttpOnly; SameSite=Lax`
- Refresh the page: session persists
- `GET /manifest.webmanifest` and `GET /sw.js` → 200
- Custom domain: same checks over HTTPS

---

## 7. What not to do

- Do not set `export const runtime = "edge"` — OpenNext uses the **Node.js** runtime on `workerd`.
- Do not import `cloudflare:` / KV / D1 / R2 in `src/` (bindings stay in `wrangler.jsonc` only).
- Do not use `@cloudflare/next-on-pages` (deprecated).
- Image Resizing: `wrangler.jsonc` includes an `IMAGES` binding for `next/image`. If the account has no Images entitlement, remove that block and set `images.unoptimized = true` in `next.config.ts`.
