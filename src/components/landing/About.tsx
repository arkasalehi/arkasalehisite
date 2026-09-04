import { Avatar } from "@/components/ui/Avatar";
import { CoverImage } from "@/components/content/CoverImage";
import { samples } from "@/lib/media";
import type { SiteCms } from "@/lib/cms/types";

export function About({ cms }: { cms: SiteCms }) {
  return (
    <section className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <blockquote className="max-w-xl">
        <p className="text-[28px] font-extrabold leading-[1.35] tracking-tight md:text-[40px]">
          «{cms.about.bio}»
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Avatar name={cms.about.title} src={cms.about.avatarUrl || samples.portrait} size="md" />
          <div>
            <p className="font-semibold">{cms.about.title}</p>
            <p className="text-sm text-muted">خالق استودیو arkasalehi</p>
          </div>
        </div>
      </blockquote>
      <div className="editorial-media relative aspect-[4/5] overflow-hidden rounded-[24px] md:aspect-[4/4.6]">
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
