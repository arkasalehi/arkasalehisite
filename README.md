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

```bash
npx wrangler login
npm run cf:deploy
```

Or connect this GitHub repo in the Cloudflare dashboard (Workers → Next.js / OpenNext).

Build command: `npx opennextjs-cloudflare build` (or `npm run build` — Workers CI delegates to OpenNext)

Runtime on Workers needs **Prisma Accelerate** (`PRISMA_ACCELERATE_URL=prisma://...`). Set `NEXT_PUBLIC_BASE_URL` at **build** time.

Full env list, cookies, and custom domain: **[DEPLOY.md](./DEPLOY.md)**.

### Node (self-hosted)

```bash
npx prisma migrate deploy
npm run build
npm start
```
