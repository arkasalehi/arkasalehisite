const SKILLS = [
  {
    title: "طراحی محصول",
    body: "رابط خلوت و خوانا، با فاصله و کنتراست مناسب برای فارسی.",
  },
  {
    title: "وب و انتشار",
    body: "سایت و پلتفرم محتوا: وبلاگ، ویدیو و فضای کار، آمادهٔ انتشار.",
  },
  {
    title: "منتورشیپ",
    body: "جلسهٔ خصوصی برای معماری محصول و مسیر انتشار.",
  },
  {
    title: "راست‌به‌چپ",
    body: "چیدمان فارسی، فاصله و کنتراست، طوری که متن راحت خوانده شود.",
  },
  {
    title: "وردپرس و ووکامرس",
    body: "طراحی و راه‌اندازی سایت و فروشگاه با وردپرس و ووکامرس.",
  },
  {
    title: "اپلیکیشن اندروید",
    body: "ساخت اپ اندروید برای محصول، از ساختار صفحه تا نسخهٔ قابل نصب.",
  },
];

export function Skills() {
  return (
    <section id="skills" className="site-container scroll-mt-20 py-16 md:py-24">
      <div className="max-w-2xl">
        <h2 className="text-[28px] font-semibold tracking-tight text-foreground md:text-[36px]">مهارت‌ها</h2>
        <p className="mt-3 text-[15px] leading-8 text-muted">طراحی، ساخت و انتشار. از رابط فارسی تا وب، وردپرس و اپ.</p>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SKILLS.map((skill) => (
          <li key={skill.title} className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-[17px] font-semibold tracking-tight text-foreground">{skill.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{skill.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
