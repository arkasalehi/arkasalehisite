import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { workspaceUrl } from "@/lib/runtime";

const LAYERS = [
  { name: "Chat", tone: "text-[#3ecf8e] bg-[#3ecf8e]/10" },
  { name: "Meeting", tone: "text-[#5c6bc0]" },
  { name: "Tasks", tone: "text-[#3ecf8e]" },
  { name: "Blog", tone: "text-amber-600" },
  { name: "Shorts", tone: "text-pink-500" },
];

const ASSETS = [
  { src: "/samples/blog-1.jpg", alt: "نمونه تصویر وبلاگ" },
  { src: "/samples/video-1.jpg", alt: "نمونه تصویر ویدیو" },
  { src: "/samples/tool-1.jpg", alt: "نمونه تصویر ابزار" },
];
const FACES = ["/samples/collab/host.jpg", "/samples/collab/peer-a.jpg", "/samples/collab/peer-b.jpg"];

export function StudioPitch() {
  return (
    <section className="relative z-10" dir="rtl">
      <div className="mx-auto max-w-7xl px-1 pt-8 pb-6 md:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
            <SparkIcon className="h-4 w-4 text-[#3ecf8e]" />
            جدید: انتشار آنی از ورک‌اسپیس
          </p>
          <h2 className="text-[32px] font-semibold tracking-tight text-foreground sm:text-[44px] md:text-[52px]">
            محتوا را با سرعت نور بیرون بدهید
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-8 text-muted md:text-lg">
            ورک‌اسپیس آرکا جایی است برای طراحی، همکاری و انتشار در یک فضا. بدون پراکندگی — مگر اینکه خودتان بخواهید عمیق‌تر شوید.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={workspaceUrl()} className="spark-cta">
              <span className="spark-cta-points" aria-hidden>
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} className="spark-cta-point" />
                ))}
              </span>
              <span className="spark-cta-inner">
                رایگان شروع کنید
                <svg className="spark-cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M13 6l-6 6 6 6" />
                </svg>
              </span>
            </a>
            <Link
              href="/video"
              className="sb-btn sb-btn-secondary group relative min-w-[132px] px-[17px] font-medium"
            >
              <span className="relative z-10 font-medium">نمایش ویدیو</span>
              <span
                aria-hidden
                className="absolute bottom-0 left-1/2 h-px w-[70%] -translate-x-1/2 opacity-30 transition group-hover:opacity-80"
                style={{ background: "linear-gradient(90deg,transparent,#3ecf8e,transparent)" }}
              />
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-[#8f8f8f]">
            <div className="flex -space-x-2 space-x-reverse">
              {FACES.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt="همکار استودیو آرکا"
                  loading="lazy"
                  decoding="async"
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
                />
              ))}
            </div>
            <span>تیم‌های استودیو و محتوا به آرکا اعتماد می‌کنند</span>
          </div>
        </div>
      </div>

      <StudioWindow />
    </section>
  );
}

function StudioWindow() {
  return (
    <div dir="ltr" className="mx-auto max-w-7xl">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] shadow-[0_28px_70px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <div className="ms-3 hidden items-center gap-2 rounded-lg border border-white/10 bg-[#242424] px-2 py-1 text-xs text-[#a0a0a0] sm:flex">
              Arka Studio — Project: Aurora
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={workspaceUrl()} className="rounded-md bg-[#3ecf8e] px-3 py-1.5 text-xs font-semibold text-[#171717]">
              Publish
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          <aside className="hidden border-e border-white/10 bg-[#171717] p-3 md:col-span-3 md:block">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#242424] px-2 py-1 text-xs font-medium text-[#a0a0a0]">
                Outline
              </span>
            </div>
            <div className="space-y-3">
              <div className="space-y-2 rounded-xl bg-[#242424] p-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#ededed]">Workspace — 1200</span>
                  <span className="rounded-md bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-[#8f8f8f]">Primary</span>
                </div>
                <ul className="space-y-1 text-xs text-[#a0a0a0]">
                  {LAYERS.map((item, i) => (
                    <li
                      key={item.name}
                      className={`flex items-center gap-2 rounded-md px-2 py-1 ${i === 0 ? item.tone : "hover:bg-[#242424]"}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#3ecf8e]" : "bg-[#cdd5ce]"}`} />
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-[#242424] p-2 shadow-sm">
                <p className="mb-2 text-xs font-semibold text-[#ededed]">Assets</p>
                <div className="grid grid-cols-3 gap-2">
                  {ASSETS.map((asset) => (
                    <div key={asset.src} className="aspect-video overflow-hidden rounded-md bg-[#2a2a2a]">
                      <img src={asset.src} alt={asset.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="relative md:col-span-6">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs text-[#a0a0a0]">
              <span>Breakpoint</span>
              <span className="rounded-md bg-[#2a2a2a] px-1.5 py-0.5">Desktop</span>
              <span className="text-[#cdd5ce]">|</span>
              <span>1200</span>
            </div>
            <div className="relative p-4 sm:p-6">
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#242424]">
                <img
                  src="/samples/studio.jpg"
                  alt="بوم استودیو آرکا برای چت، جلسه و تسک"
                  loading="lazy"
                  decoding="async"
                  className="h-[280px] w-full object-cover sm:h-[380px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e2a24]/70 via-transparent to-transparent" />
                <div className="absolute inset-x-5 bottom-5">
                  <div className="max-w-xl rounded-xl border border-white/20 bg-[#1e2a24]/55 p-4 text-white backdrop-blur-md">
                    <p className="text-2xl font-semibold tracking-tight sm:text-3xl">Studio canvas</p>
                    <p className="mt-1 text-sm text-white/80">چت، جلسه و تسک‌ها روی یک بوم — آماده برای انتشار.</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-md bg-[#242424] px-3 py-1.5 text-xs font-medium text-[#ededed]">Auto layout</span>
                      <span className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white">Drag</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-4 right-4 hidden w-44 rounded-xl border border-white/10 bg-[#171717] p-2 shadow-lg lg:block">
                <div className="overflow-hidden rounded-md">
                  <img
                    src="/samples/short-1.jpg"
                    alt="پیش‌نمایش عمودی شورتس"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[9/16] w-full object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#8f8f8f]">
                  <span>Mobile 390</span>
                  <span className="rounded bg-[#2a2a2a] px-1 py-0.5">Preview</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden border-s border-white/10 bg-[#171717] p-3 md:col-span-3 md:block">
            <p className="mb-3 inline-flex rounded-md border border-white/10 bg-[#242424] px-2 py-1 text-xs font-medium text-[#a0a0a0]">
              Properties
            </p>
            <div className="space-y-3">
              <div className="rounded-xl bg-[#242424] p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[#a0a0a0]">Position</span>
                  <span className="rounded-md bg-[#2a2a2a] px-2 py-0.5 text-[10px] text-[#8f8f8f]">Relative</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-[#a0a0a0]">
                  {["Top", "Center", "Bottom"].map((label) => (
                    <span key={label} className="rounded-md border border-white/10 bg-[#242424] px-2 py-1 text-center">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-[#242424] p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-[#a0a0a0]">Size</span>
                  <span className="rounded-md bg-[#2a2a2a] px-2 py-0.5 text-[10px] text-[#8f8f8f]">Auto</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-medium text-[#a0a0a0]">
                  <span className="rounded-md border border-white/10 bg-[#242424] px-2 py-1">W: 1200</span>
                  <span className="rounded-md border border-white/10 bg-[#242424] px-2 py-1">H: Auto</span>
                </div>
              </div>
              <div className="rounded-xl bg-[#242424] p-3 shadow-sm text-[11px]">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[#a0a0a0]">Effects</span>
                  <span className="rounded-md bg-[#2a2a2a] px-2 py-0.5 text-[10px] text-[#8f8f8f]">3</span>
                </div>
                {[
                  ["Blur", "8px"],
                  ["Glow", "20%"],
                  ["Blend", "Overlay"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-1 text-[#a0a0a0]">
                    <span>{k}</span>
                    <span className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-[#8f8f8f]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    </svg>
  );
}
