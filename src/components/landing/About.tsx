import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { Avatar } from "@/components/ui/Avatar";
import { CoverImage } from "@/components/content/CoverImage";
import { samples } from "@/lib/media";
import { workspaceUrl } from "@/lib/runtime";
import type { SiteCms } from "@/lib/cms/types";

export function About({ cms }: { cms: SiteCms }) {
  return (
    <section className="grid items-stretch gap-5 md:grid-cols-2 md:gap-6">
      <blockquote className="flex flex-col justify-center rounded-xl border border-border bg-card p-7 md:p-9">
        <p className="text-[13px] font-medium text-primary">درباره استودیو</p>
        <p className="mt-4 text-[20px] font-semibold leading-[1.7] tracking-tight text-foreground md:text-[24px]">
          «{cms.about.bio}»
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Avatar name={cms.about.title} src={cms.about.avatarUrl || samples.portrait} size="md" />
          <div>
            <p className="font-semibold text-foreground">{cms.about.title}</p>
            <p className="text-sm text-muted">خالق استودیو arkasalehi</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={workspaceUrl()} className="sb-btn sb-btn-primary h-10 px-4 text-[14px]">
            ورود به ورک‌اسپیس
          </a>
          <Link href="/blog" className="sb-btn sb-btn-secondary h-10 px-4 text-[14px]">
            وبلاگ
          </Link>
        </div>
      </blockquote>
      <div className="editorial-media relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_16px_40px_rgba(20,60,100,0.1)] md:aspect-auto md:min-h-[420px]">
        <CoverImage
          src={cms.about.avatarUrl || samples.studio}
          alt={cms.about.title}
          seed="about"
          kind="studio"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </section>
  );
}
