"use client";

import { usePathname } from "next/navigation";
import { Header, Footer } from "@/components/layout/Shell";
import { OnboardingBanner } from "@/components/layout/OnboardingBanner";
import type { SiteCms } from "@/lib/cms/types";

export function SiteChrome({ children, cms }: { children: React.ReactNode; cms: SiteCms }) {
  const pathname = usePathname();
  const home = pathname === "/";

  return (
    <div className="site-saas flex min-h-full flex-col">
      {home ? null : <Header cms={cms} />}
      <main className="w-full flex-1">
        {home ? (
          children
        ) : (
          <div className="site-container py-8 md:py-12">
            <OnboardingBanner />
            {children}
          </div>
        )}
      </main>
      <Footer cms={cms} />
    </div>
  );
}
