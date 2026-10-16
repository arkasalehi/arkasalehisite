"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { SiteChrome } from "@/components/layout/SiteChrome";
import type { SiteCms } from "@/lib/cms/types";
import { isWorkspaceDocument, usesSiteChrome } from "@/lib/runtime";
import { restoreWsChrome, syncPublicThemeFromStorage } from "@/lib/theme/workspace";

function useHost() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.host,
    () => "",
  );
}

export function RootFrame({ children, cms }: { children: React.ReactNode; cms: SiteCms }) {
  const pathname = usePathname();
  const host = useHost();
  const workspaceDoc = isWorkspaceDocument(pathname, host);
  const site = usesSiteChrome(pathname, host);

  useLayoutEffect(() => {
    const onWorkspace = isWorkspaceDocument(pathname, window.location.host);
    if (onWorkspace) restoreWsChrome();
    else syncPublicThemeFromStorage();
  }, [pathname]);

  if (site) {
    return <SiteChrome cms={cms}>{children}</SiteChrome>;
  }

  if (workspaceDoc && pathname.startsWith("/ws")) {
    return <main className="h-dvh min-h-0 w-full overflow-hidden">{children}</main>;
  }

  return <main className="grid h-dvh w-full place-items-center overflow-auto p-4">{children}</main>;
}
