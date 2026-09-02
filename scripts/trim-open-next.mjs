import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Smallest valid WASM module so Wrangler can still resolve imports. */
const STUB = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const root = join(process.cwd(), ".open-next");
const stubbed = [];
for (const file of walk(root)) {
  if (!file.endsWith(".wasm")) continue;
  writeFileSync(file, STUB);
  stubbed.push(file.replace(process.cwd(), "."));
}
console.log(`trim-open-next: stubbed ${stubbed.length} wasm files`);
for (const file of stubbed) console.log("  -", file);
