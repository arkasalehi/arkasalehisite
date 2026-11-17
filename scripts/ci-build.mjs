import { spawnSync } from "node:child_process";

/**
 * Workers Builds runs two different commands:
 * - production (`main`): `npx opennextjs-cloudflare build`, which calls `npm run build`
 * - other branches: `npm run build`, then `npx wrangler versions upload`
 *
 * The upload reads `.open-next/worker.js`. A plain `next build` does not create it,
 * so preview checks fail. OpenNext sets NEXT_PRIVATE_STANDALONE before it calls
 * `npm run build`, which stops this script from starting OpenNext again.
 */
function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true, env: process.env });
  if (result.status) process.exit(result.status ?? 1);
}

const workersPreview = process.env.WORKERS_CI === "1" && process.env.NEXT_PRIVATE_STANDALONE !== "true";

if (workersPreview) {
  run("npx", ["opennextjs-cloudflare", "build"]);
  run("node", ["scripts/trim-open-next.mjs"]);
} else {
  run("npx", ["next", "build"]);
}
