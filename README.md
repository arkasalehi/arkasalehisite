# آرکا صالحی (arkasalehisite)

Persian RTL creator platform. Only the admin publishes; visitors can like, save, comment, and buy.

Portable between **Cloudflare Workers** (OpenNext) and a self-hosted **Node.js** server. No Cloudflare-only APIs in application code.

## Stack

- **Next.js 16** (App Router) + React 19 + Tailwind 4
- **Supabase** (Postgres, Auth, Realtime)
- **Cloudflare Workers** via `@opennextjs/cloudflare`

## Run locally

```bash
cp .env.example .env
# set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Apply `supabase/migrations/20260903120000_init.sql` in the Supabase SQL editor once.

Open [http://localhost:3000](http://localhost:3000).

Register `admin@arkasalehi.ir` to get the admin role (and demo content). Disable **Confirm email** in Supabase Auth if you want instant login.

## Deploy (Cloudflare / OpenNext)

Do **not** publish the raw `.next` folder. OpenNext builds Next.js, then emits a Worker in `.open-next/`.

**Cloudflare dashboard (required):**

| Field | Value |
| --- | --- |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Output directory | leave empty (not `.next`) |

Runtime on Workers uses the Supabase HTTP API. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_BASE_URL` at **build** time.

```bash
npx wrangler login
npm run cf:build
npm run cf:deploy
```

Full env list, cookies, custom domain, and clean reinstall: **[DEPLOY.md](./DEPLOY.md)**.

### Node (self-hosted)

```bash
npm run build
npm start
```
