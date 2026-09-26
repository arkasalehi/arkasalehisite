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
          className="rounded-[24px] border border-[#e8ece6] bg-white/85 p-6 shadow-[0_16px_40px_rgba(20,60,100,0.08)] backdrop-blur-md"
        >
          <p className="text-[13px] font-semibold text-[#3390ec]">{step.n}</p>
          <h3 className="mt-3 text-[18px] font-semibold tracking-tight text-[#1e2a24]">{step.title}</h3>
          <p className="mt-2 text-sm leading-7 text-[#8b938d]">{step.body}</p>
        </article>
      ))}
    </div>
  );
}
