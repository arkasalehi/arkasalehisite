import assert from "node:assert/strict";
import { authCookieKey } from "./auth/gate-key.ts";
import { isTestContent } from "./content-visibility.ts";
import { jsonLdScript } from "./jsonld.ts";
import { resolveDocumentTitle } from "./seo-title.ts";

const prefix = "base64-eyJhbGciOiJIUzI1N";
assert.equal(prefix.length, 24);
const userA = `${prefix}.payload-user-a`;
const userB = `${prefix}.payload-user-b`;
assert.equal(userA.slice(0, 24), userB.slice(0, 24));

const keyA = await authCookieKey([{ name: "sb-project-auth-token", value: userA }]);
const keyB = await authCookieKey([{ name: "sb-project-auth-token", value: userB }]);
assert.notEqual(keyA, keyB);
assert.equal(keyA.length, 64);
assert.equal(await authCookieKey([{ name: "theme", value: "dark" }]), "none");

const injected = jsonLdScript({ body: '</script><script>alert("x")</script>' });
assert.equal(injected.includes("<"), false);
assert.equal(injected.includes(">"), false);
assert.match(injected, /\\u003c/);

const article = resolveDocumentTitle("تست", "آرکا صالحی", "/blog/test");
assert.equal(article.title, "تست");
assert.equal(article.social, "تست | آرکا صالحی");
const home = resolveDocumentTitle("آرکا صالحی", "آرکا صالحی", "/");
assert.deepEqual(home.title, { absolute: "آرکا صالحی" });
assert.equal(home.social, "آرکا صالحی");
const already = resolveDocumentTitle("تست | آرکا صالحی", "آرکا صالحی", "/blog/x");
assert.deepEqual(already.title, { absolute: "تست | آرکا صالحی" });

assert.equal(isTestContent({ title: "تست", slug: "real-story" }), true);
assert.equal(isTestContent({ title: "یادداشت استودیو", slug: "studio-note" }), false);
assert.equal(isTestContent({ title: "انتشار", slug: "demo-card" }), true);

console.log("audit helpers: pass");
