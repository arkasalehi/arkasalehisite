"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { SiteChrome } from "@/components/layout/SiteChrome";
import type { SiteCms } from "@/lib/cms/types";
import { isWorkspaceDocument, usesSiteChrome } from "@/lib/runtime";
import { restoreWsChrome, syncPublicThemeFromStorage } from "@/lib/theme/workspace";

export function RootFrame({
  children,
  cms,
  host,
}: {
  children: React.ReactNode;
  cms: SiteCms;
  host: string;
}) {
  const pathname = usePathname();
  const workspaceDoc = isWorkspaceDocument(pathname, host);
  const site = usesSiteChrome(pathname, host);

  useLayoutEffect(() => {
    if (workspaceDoc) restoreWsChrome();
    else syncPublicThemeFromStorage();
  }, [workspaceDoc]);

  if (site) {
    return <SiteChrome cms={cms}>{children}</SiteChrome>;
  }

  if (workspaceDoc && pathname.startsWith("/ws")) {
    return <main className="h-dvh min-h-0 w-full overflow-hidden">{children}</main>;
  }

  return <main className="grid h-dvh w-full place-items-center overflow-auto p-4">{children}</main>;
}
