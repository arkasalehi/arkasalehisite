import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { vazir } from "@/lib/fonts";
import { siteConfig } from "@/lib/config";
import { getSiteCms } from "@/lib/data/settings";
import { Providers } from "@/components/providers";
import { RootFrame } from "@/components/layout/RootFrame";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { isWorkspaceDocument, requestHost } from "@/lib/runtime";
import { parseWsTheme, wsLocaleOrDefault, wsThemeOrDefault } from "@/lib/theme/prefs";

export const revalidate = 60;

const bootScript = `(function(){try{var d=document.documentElement,c=document.cookie,host=location.hostname,path=location.pathname,ws=host.indexOf("workspace.")===0||path.indexOf("/ws")===0;function ck(n){var m=c.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):""}function ls(k){try{return localStorage.getItem(k)||""}catch(e){return""}}function ok(v,a,b){return v===a||v===b?v:""}function save(n,v){try{document.cookie=n+"="+v+"; Path=/; Max-Age=31536000; SameSite=Lax"+(location.protocol==="https:"?"; Secure":"")}catch(e){}}if(ws){d.classList.add("ws");var t=ok(ck("ws_theme")||ls("ws-theme"),"light","dark")||"dark";d.classList.toggle("ws-theme-light",t==="light");d.classList.toggle("dark",t==="dark");d.style.colorScheme=t;if(!ck("ws_theme"))save("ws_theme",t);var loc=ok(ck("ws_locale")||ls("ws-locale"),"fa","en")||"fa";d.lang=loc==="en"?"en":"fa";d.dir=loc==="en"?"ltr":"rtl";if(!ck("ws_locale"))save("ws_locale",loc)}else{d.classList.remove("ws","ws-theme-light");d.lang="fa";d.dir="rtl";d.style.colorScheme="";var a=ok(ck("as_theme")||ls("as_theme"),"light","dark");if(a){d.classList.toggle("dark",a==="dark");if(!ck("as_theme"))save("as_theme",a)}}}catch(e){}})();`;

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
  const cms = await getSiteCms();
  const hdrs = await headers();
  const jar = await cookies();
  const host = requestHost(hdrs.get("x-forwarded-host") || hdrs.get("host"));
  const path = hdrs.get("x-arka-path") || "";
  const workspaceDoc = hdrs.get("x-arka-app") === "workspace" || isWorkspaceDocument(path, host);
  const wsTheme = wsThemeOrDefault(jar.get("ws_theme")?.value);
  const wsLocale = wsLocaleOrDefault(jar.get("ws_locale")?.value);
  const asTheme = parseWsTheme(jar.get("as_theme")?.value) ?? "light";
  const lang = workspaceDoc ? (wsLocale === "en" ? "en" : "fa") : "fa";
  const dir = lang === "en" ? "ltr" : "rtl";
  const dark = workspaceDoc ? wsTheme === "dark" : asTheme === "dark";
  const htmlClass = [
    vazir.variable,
    vazir.className,
    "h-full",
    workspaceDoc ? "ws" : "",
    workspaceDoc && wsTheme === "light" ? "ws-theme-light" : "",
    dark ? "dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang={lang} dir={dir} className={htmlClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="h-full font-sans antialiased" suppressHydrationWarning>
        <ServiceWorkerRegister />
        <Providers initialTheme={workspaceDoc ? wsTheme : asTheme} workspaceDoc={workspaceDoc}>
          <RootFrame cms={cms} host={host}>
            {children}
          </RootFrame>
        </Providers>
      </body>
    </html>
  );
}
