import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { playfair, vazir } from "@/lib/fonts";
import { siteConfig } from "@/lib/config";
import { getSession } from "@/lib/auth/session";
import { getSiteCms } from "@/lib/data/settings";
import { Providers } from "@/components/providers";
import { Header, Footer } from "@/components/layout/Shell";
import { PageContainer } from "@/components/layout/Page";
import { OnboardingBanner } from "@/components/layout/OnboardingBanner";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getSiteCms();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: cms.seo.title,
      template: `%s | ${cms.seo.title}`,
    },
    description: cms.seo.description,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg" },
    appleWebApp: { capable: true, title: cms.seo.title, statusBarStyle: "black-translucent" },
    openGraph: {
      siteName: cms.seo.title,
      locale: siteConfig.locale,
      type: "website",
      images: cms.seo.ogImage ? [{ url: cms.seo.ogImage }] : undefined,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, cms, cookieStore] = await Promise.all([getSession(), getSiteCms(), cookies()]);
  const theme = cookieStore.get("as_theme")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazir.variable} ${playfair.variable} h-full${theme === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased">
        <ServiceWorkerRegister />
        <Providers user={user} theme={theme}>
          <Header cms={cms} />
          <main className="w-full flex-1">
            <PageContainer className="py-8 md:py-10">
              <OnboardingBanner />
              {children}
            </PageContainer>
          </main>
          <Footer cms={cms} />
        </Providers>
      </body>
    </html>
  );
}
