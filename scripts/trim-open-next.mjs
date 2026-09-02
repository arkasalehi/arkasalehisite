import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const root = join(process.cwd(), ".open-next");
const removed = [];
for (const file of walk(root)) {
  if (file.endsWith(".wasm")) {
    rmSync(file);
    removed.push(file.replace(process.cwd(), "."));
  }
}
console.log(`trim-open-next: removed ${removed.length} wasm files`);
for (const file of removed) console.log("  -", file);
