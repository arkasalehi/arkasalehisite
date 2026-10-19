import assert from "node:assert/strict";
import { isRetiredPublicHref, publicLinks } from "./public-links.ts";

assert.equal(isRetiredPublicHref("/products"), true);
assert.equal(isRetiredPublicHref("/products/notebook"), true);
assert.equal(isRetiredPublicHref("/shorts/clip"), true);
assert.equal(isRetiredPublicHref("/cart"), true);
assert.equal(isRetiredPublicHref("/blog"), false);
assert.equal(isRetiredPublicHref("/#contact"), false);

const fallback = [
  { label: "وبلاگ", href: "/blog" },
  { label: "تماس", href: "/#contact" },
];
const cleaned = publicLinks(
  [
    { label: "وبلاگ", href: "/blog" },
    { label: "فروشگاه", href: "/products" },
    { label: "شورتس", href: "/shorts" },
    { label: "تماس", href: "/#contact" },
  ],
  fallback,
);
assert.deepEqual(cleaned, [
  { label: "وبلاگ", href: "/blog" },
  { label: "تماس", href: "/#contact" },
]);
assert.deepEqual(publicLinks([{ label: "فروشگاه", href: "/products" }], fallback), fallback);
console.log("public links: pass");
