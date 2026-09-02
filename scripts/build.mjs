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

run("npx prisma generate");
run("npx next build");

// Workers Builds runs `npm run build` then `npx wrangler deploy`. Wrangler
// then calls `opennextjs-cloudflare deploy`, which needs `.open-next/`.
// Local `npm run build` stays Next-only. When OpenNext itself invoked this
// script (NEXT_PRIVATE_STANDALONE), skip the nested conversion.
const insideOpenNext = process.env.NEXT_PRIVATE_STANDALONE === "true";
const workersCi = process.env.WORKERS_CI === "1" || process.env.CF_PAGES === "1";

if (workersCi && !insideOpenNext) {
  run("npx opennextjs-cloudflare build --skipNextBuild");
}
