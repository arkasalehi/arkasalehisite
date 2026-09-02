import { spawnSync } from "node:child_process";

function run(command) {
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.error) throw result.error;
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

const insideOpenNext = process.env.NEXT_PRIVATE_STANDALONE === "true";
const workersCi = process.env.WORKERS_CI === "1" || process.env.CF_PAGES === "1";

// Workers Builds runs `npm run build` then `npx wrangler deploy`. Wrangler
// then calls `opennextjs-cloudflare deploy`, which needs `.open-next/`.
// OpenNext must run `next build` itself so it can set NEXT_PRIVATE_STANDALONE
// (creates `.next/standalone`). `--skipNextBuild` after a plain `next build`
// fails copying middleware traces into a missing standalone folder.
if (workersCi && !insideOpenNext) {
  run("npx opennextjs-cloudflare build");
  process.exit(0);
}

run("npx prisma generate");
run("npx next build");
