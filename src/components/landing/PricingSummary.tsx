import type { PricingCms } from "@/lib/cms/types";
import { formatToman } from "@/lib/utils";

export function PricingSummary({ pricing }: { pricing: PricingCms }) {
  const packages = pricing.packages.slice(0, 3);

  return (
    <section id="pricing" className="ph-section">
      <div className="site-container">
        <div className="ph-split-head">
          <div>
            <span className="ph-tag">قیمت</span>
            <h2 className="ph-display">{pricing.title}</h2>
            <p className="ph-lede">
              {pricing.description}
            </p>
          </div>
          <a href="#contact" className="ph-btn ph-btn-light">
            سفارش
          </a>
        </div>
        <div className="ph-price-grid">
          {packages.map((item) => (
            <article key={item.id} className={item.highlighted ? "ph-price ph-price-ink" : "ph-price"}>
              <p className="ph-price-kicker">{item.highlighted ? "پیشنهادی" : "بسته"}</p>
              <h3>{item.name}</h3>
              <p className="ph-price-amount">
                {item.priceAmount != null ? formatToman(item.priceAmount) : item.priceLabel || "توافقی"}
              </p>
              <p className="ph-muted">{item.description}</p>
              <a href={item.href || "#contact"} className={item.highlighted ? "ph-btn ph-btn-light" : "ph-btn ph-btn-black"}>
                گفتگو
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
