"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { SiteCms } from "@/lib/cms/types";

export function Hero({ cms }: { cms: SiteCms }) {
  const { hero } = cms;
  return (
    <section className="full-bleed relative overflow-hidden px-4 pb-10 pt-4 md:-mt-8 md:px-0 md:pt-8">
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-80" />
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[12%] top-16 h-64 w-64 rounded-full bg-[var(--primary)]/25 blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[8%] top-8 h-72 w-72 rounded-full bg-[var(--accent)]/18 blur-3xl"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="float-slow absolute left-[18%] top-24 h-16 w-16 rounded-2xl border border-white/10 bg-white/5" />
        <div className="float-slower absolute right-[22%] top-40 h-10 w-10 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10" />
        <div className="float-slow absolute bottom-16 left-[40%] h-8 w-24 rounded-full border border-white/8 bg-white/5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 md:px-16 md:py-28"
      >
        <p className="text-sm tracking-wide text-accent">استودیوی تک‌خالق</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.35] md:text-6xl">{hero.title}</h1>
        <p className="mt-5 max-w-xl text-xl leading-9 text-muted">{hero.subtitle}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button href={hero.ctaPrimaryHref}>{hero.ctaPrimary}</Button>
          <Button href={hero.ctaSecondaryHref} variant="ghost">
            {hero.ctaSecondary}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
