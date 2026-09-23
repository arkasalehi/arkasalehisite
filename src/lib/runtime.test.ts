import assert from "node:assert/strict";
import { isLoopbackOrigin, isPublicAuthPath, publicOriginFromHost } from "./runtime.ts";

assert.equal(isLoopbackOrigin("http://localhost:3000"), true);
assert.equal(isLoopbackOrigin("https://arkasalehi.com"), false);
assert.equal(publicOriginFromHost("workspace.arkasalehi.com"), "https://arkasalehi.com");
assert.equal(publicOriginFromHost("arkasalehi.com"), "https://arkasalehi.com");
assert.equal(publicOriginFromHost("localhost:3000"), "");
assert.equal(isPublicAuthPath("/login"), true);
assert.equal(isPublicAuthPath("/api/auth/login"), true);
assert.equal(isPublicAuthPath("/ws"), false);
console.log("runtime origin helpers: pass");
