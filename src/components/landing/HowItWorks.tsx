const STEPS = [
  {
    n: "۰۱",
    title: "برنامه‌ریزی",
    body: "ایده‌ها، اولویت‌ها و تقویم را در یک فضای مشترک جمع کنید تا مسیر کار واضح بماند.",
  },
  {
    n: "۰۲",
    title: "همکاری",
    body: "چت، جلسه و تسک‌ها کنار هم پیش می‌روند؛ تیم بدون پراکندگی جلو می‌رود.",
  },
  {
    n: "۰۳",
    title: "انتشار",
    body: "وقتی آماده شد، محتوا را از استودیو بیرون بدهید — وبلاگ، ویدیو یا محصول.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STEPS.map((step) => (
        <article
          key={step.n}
          className="rounded-xl border border-border bg-card p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand)_45%,var(--border))]"
        >
          <p className="font-mono text-[13px] font-medium text-primary">{step.n}</p>
          <h3 className="mt-3 text-[18px] font-semibold tracking-tight text-foreground">{step.title}</h3>
          <p className="mt-2 text-sm leading-7 text-muted">{step.body}</p>
        </article>
      ))}
    </div>
  );
}
