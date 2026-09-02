"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { SiteCms } from "@/lib/cms/types";

export function Hero({ cms }: { cms: SiteCms }) {
  const { hero } = cms;
  return (
    <section className="full-bleed relative overflow-hidden px-4 pb-8 pt-6 md:-mt-8 md:px-0 md:pt-10">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-10 top-8 h-56 w-56 rounded-full bg-cyan-400/16 blur-3xl"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-20 h-64 w-64 rounded-full bg-blue-500/14 blur-3xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-lg)] px-6 py-16 md:px-14 md:py-24"
      >
        <p className="text-sm text-accent">استودیوی تک‌خالق</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.35] md:text-6xl">{hero.title}</h1>
        <p className="mt-4 max-w-xl text-xl text-muted">{hero.subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={hero.ctaPrimaryHref}>{hero.ctaPrimary}</Button>
          <Button href={hero.ctaSecondaryHref} variant="ghost">
            {hero.ctaSecondary}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
