import type { Metadata } from "next";
import "./globals.css";
import { playfair, vazir } from "@/lib/fonts";
import { siteConfig } from "@/lib/config";
import { getSession } from "@/lib/auth/session";
import { getSiteCms } from "@/lib/data/settings";
import { Providers } from "@/components/providers";
import { Header, Footer, MobileNav } from "@/components/layout/Shell";
import { PageContainer } from "@/components/layout/Page";
import { ScrollProgress } from "@/components/layout/ScrollChrome";
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

const themeBoot = `(function(){try{var t=localStorage.getItem('as_theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, cms] = await Promise.all([getSession(), getSiteCms()]);

  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${playfair.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-full pb-20 font-sans antialiased md:pb-0">
        <Providers user={user}>
          <ScrollProgress />
          <Header cms={cms} />
          <main className="w-full flex-1">
            <PageContainer className="py-8 md:py-10">
              <OnboardingBanner />
              {children}
            </PageContainer>
          </main>
          <Footer cms={cms} />
          <MobileNav />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
