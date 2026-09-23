import { spawnSync } from "node:child_process";

function isLoopback(value) {
  return /localhost|127\.0\.0\.1/i.test(value || "");
}

if (isLoopback(process.env.NEXT_PUBLIC_BASE_URL)) {
  process.env.NEXT_PUBLIC_BASE_URL = "https://arkasalehi.com";
}
if (isLoopback(process.env.NEXT_PUBLIC_SITE_URL)) {
  process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://arkasalehi.com";
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  process.env.NEXT_PUBLIC_BASE_URL = "https://arkasalehi.com";
}
if (!process.env.NEXT_PUBLIC_WORKSPACE_URL || isLoopback(process.env.NEXT_PUBLIC_WORKSPACE_URL)) {
  process.env.NEXT_PUBLIC_WORKSPACE_URL = "https://workspace.arkasalehi.com";
}

const build = spawnSync("npx", ["opennextjs-cloudflare", "build"], { stdio: "inherit", shell: true, env: process.env });
if (build.status) process.exit(build.status ?? 1);
const trim = spawnSync("node", ["scripts/trim-open-next.mjs"], { stdio: "inherit", shell: true, env: process.env });
process.exit(trim.status ?? 0);
