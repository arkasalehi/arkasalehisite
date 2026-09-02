import { Avatar } from "@/components/ui/Avatar";
import { Reveal } from "@/components/motion/Reveal";
import type { SiteCms } from "@/lib/cms/types";

export function About({ cms }: { cms: SiteCms }) {
  return (
    <Reveal>
      <section className="glass grid items-center gap-6 rounded-[var(--radius-lg)] p-6 md:grid-cols-[auto_1fr] md:p-10">
        <Avatar name={cms.about.title} src={cms.about.avatarUrl || undefined} size="lg" />
        <div>
          <p className="text-sm text-accent">درباره خالق</p>
          <h2 className="mt-1 text-2xl font-semibold">{cms.about.title}</h2>
          <p className="mt-3 max-w-2xl leading-9 text-muted">{cms.about.bio}</p>
        </div>
      </section>
    </Reveal>
  );
}
