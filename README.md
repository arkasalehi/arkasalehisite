# آرکا صالحی (arkasalehisite)

Persian RTL creator platform. Only the admin publishes; visitors can like, save, comment, and buy.

Portable between **Cloudflare Workers** (OpenNext) and a self-hosted **Node.js** server. No Cloudflare-only APIs in application code.

## Stack

- **Next.js 16** (App Router) + React 19 + Tailwind 4
- **PostgreSQL** + **Prisma 6**
- **Cloudflare Workers** via `@opennextjs/cloudflare`
- JWT cookies (`jose`) + PBKDF2 (Web Crypto)

## Run locally

```bash
cp .env.example .env
# set DATABASE_URL (postgresql://...) and JWT_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Seed accounts (see `.env.example`):

- Admin: `admin@arkasalehi.ir` / `Admin123!`
- User: `user@arkasalehi.ir` / `User123!`

## Deploy (Cloudflare / OpenNext)

Do **not** publish the raw `.next` folder. OpenNext builds Next.js, then emits a Worker in `.open-next/`.

**Cloudflare dashboard (required):**

| Field | Value |
| --- | --- |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Output directory | leave empty (not `.next`) |

Runtime on Workers needs **Prisma Accelerate** (`PRISMA_ACCELERATE_URL=prisma://...`). Set `NEXT_PUBLIC_BASE_URL` at **build** time.

```bash
npx wrangler login
npm run cf:build
npm run cf:deploy
```

Full env list, cookies, custom domain, and clean reinstall: **[DEPLOY.md](./DEPLOY.md)**.

### Node (self-hosted)

```bash
npx prisma migrate deploy
npm run build
npm start
```
