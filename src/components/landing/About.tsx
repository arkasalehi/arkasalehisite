import { Avatar } from "@/components/ui/Avatar";
import { Reveal } from "@/components/motion/Reveal";
import type { SiteCms } from "@/lib/cms/types";

export function About({ cms }: { cms: SiteCms }) {
  return (
    <Reveal>
      <section className="glass grid items-center gap-8 rounded-[2rem] p-8 md:grid-cols-[auto_1fr] md:p-12">
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-[var(--primary)]/20 blur-2xl" />
          <Avatar name={cms.about.title} src={cms.about.avatarUrl || undefined} size="lg" />
        </div>
        <div>
          <p className="text-sm text-accent">درباره خالق</p>
          <h2 className="mt-1 text-3xl font-semibold">{cms.about.title}</h2>
          <p className="mt-4 max-w-2xl text-lg leading-9 text-muted">{cms.about.bio}</p>
        </div>
      </section>
    </Reveal>
  );
}
