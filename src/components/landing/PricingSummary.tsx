import type { PricingCms } from "@/lib/cms/types";
import { formatToman } from "@/lib/utils";

export function PricingSummary({ pricing }: { pricing: PricingCms }) {
  const packages = pricing.packages.slice(0, 3);

  return (
    <section id="pricing" className="scroll-mt-20 border-y border-border bg-card/40 py-16 md:py-24">
      <div className="site-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-[28px] font-semibold tracking-tight text-foreground md:text-[36px]">{pricing.title}</h2>
            <p className="mt-3 text-[15px] leading-8 text-muted">{pricing.description}</p>
          </div>
          <a href="#contact" className="sb-btn sb-btn-secondary h-9 px-3 text-[13px]">
            سفارش
          </a>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {packages.map((item) => (
            <article
              key={item.id}
              className={`flex flex-col rounded-xl border bg-card p-6 ${
                item.highlighted ? "border-[var(--brand)]" : "border-border"
              }`}
            >
              {item.highlighted ? (
                <p className="text-[12px] font-medium text-[var(--brand)]">پیشنهادی</p>
              ) : (
                <p className="text-[12px] font-medium text-muted">بسته</p>
              )}
              <h3 className="mt-3 text-[18px] font-semibold tracking-tight text-foreground">{item.name}</h3>
              <p className="mt-4 text-[32px] font-semibold leading-none tracking-tight text-foreground">
                {item.priceAmount != null ? formatToman(item.priceAmount) : item.priceLabel || "توافقی"}
              </p>
              <p className="mt-4 flex-1 text-sm leading-7 text-muted">{item.description}</p>
              <a href={item.href || "#contact"} className={`sb-btn mt-6 h-10 w-full ${item.highlighted ? "sb-btn-primary" : "sb-btn-secondary"}`}>
                گفتگو
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
