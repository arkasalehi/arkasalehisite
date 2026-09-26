import NextLink from "next/link";
import type { ComponentProps } from "react";

/** Disables Next.js viewport/hover RSC prefetch so Cloudflare Workers are not flooded. */
export function NoPrefetchLink(props: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} prefetch={false} />;
}
