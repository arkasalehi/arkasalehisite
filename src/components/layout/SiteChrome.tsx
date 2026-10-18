"use client";

import { usePathname } from "next/navigation";
import { Header, Footer } from "@/components/layout/Shell";
import { PageContainer } from "@/components/layout/Page";
import { OnboardingBanner } from "@/components/layout/OnboardingBanner";
import type { SiteCms } from "@/lib/cms/types";

export function SiteChrome({ children, cms }: { children: React.ReactNode; cms: SiteCms }) {
  const pathname = usePathname();
  const home = pathname === "/";

  return (
    <div className="site-saas flex min-h-full flex-col">
      <Header cms={cms} />
      <main className="w-full flex-1">
        <PageContainer className={home ? "max-w-none px-0 py-0" : "py-8 md:py-12"}>
          {home ? null : <OnboardingBanner />}
          {children}
        </PageContainer>
      </main>
      <Footer cms={cms} />
    </div>
  );
}
