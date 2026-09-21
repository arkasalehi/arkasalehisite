import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { CoverImage } from "@/components/content/CoverImage";
import { samples } from "@/lib/media";
import { workspaceUrl } from "@/lib/runtime";
import type { SiteCms } from "@/lib/cms/types";

export function About({ cms }: { cms: SiteCms }) {
  return (
    <section className="grid items-stretch gap-5 md:grid-cols-2 md:gap-6">
      <blockquote className="flex flex-col justify-center rounded-[28px] border border-[#e8ece6] bg-white/85 p-7 shadow-[0_16px_40px_rgba(20,60,100,0.08)] backdrop-blur-md md:p-9">
        <p className="text-[13px] font-semibold text-[#1b6754]">درباره استودیو</p>
        <p className="mt-4 text-[20px] font-semibold leading-[1.7] tracking-tight text-[#1e2a24] md:text-[24px]">
          «{cms.about.bio}»
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Avatar name={cms.about.title} src={cms.about.avatarUrl || samples.portrait} size="md" />
          <div>
            <p className="font-semibold text-[#1e2a24]">{cms.about.title}</p>
            <p className="text-sm text-[#8b938d]">خالق استودیو arkasalehi</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={workspaceUrl()}
            className="inline-flex h-11 items-center rounded-full bg-[#2f7de9] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(47,125,233,0.28)]"
          >
            ورود به ورک‌اسپیس
          </a>
          <Link
            href="/blog"
            className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-[#1c2430] shadow-[0_8px_22px_rgba(20,50,80,0.08)] ring-1 ring-[#e8ece6]"
          >
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
