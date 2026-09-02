import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Adapter-only config. App code never imports Cloudflare KV/D1/R2.
 * Incremental cache defaults to in-memory per isolate (portable).
 * Enable R2 later via OpenNext docs if you need shared ISR across isolates.
 */
export default defineCloudflareConfig({});
