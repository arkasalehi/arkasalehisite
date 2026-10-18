const SKILLS = [
  {
    title: "طراحی محصول",
    body: "مینیمالیسم، تجربه کاربری و فاصله‌گذاری راست‌به‌چپ. دستهٔ طراحی و یادداشت‌های استودیو همین کار را توضیح می‌دهند.",
  },
  {
    title: "وب و انتشار",
    body: "ساخت پلتفرم محتوا: وبلاگ، ویدیو و یک فضای کار. معماری طوری که از کلودفلر به سرور خودتان منتقل شود.",
  },
  {
    title: "منتورشیپ",
    body: "جلسه خصوصی برای معماری محصول محتوا. همین مورد در کاتالوگ قیمت‌ها هست.",
  },
  {
    title: "راست‌به‌چپ",
    body: "چیدمان فارسی، فاصله و کنتراست را جدی می‌گیرم. یادداشت «فاصله در رابط راست‌به‌چپ» در محتوای نمونه همین را می‌گوید.",
  },
  {
    // TODO: Arka asked for WordPress/WooCommerce. No product, post, or bio in the repo mentions it.
    title: "وردپرس و ووکامرس",
    body: "سایت و فروشگاه روی وردپرس. این خط خدمات را خود آرکا گفته؛ هنوز در محتوای سایت سندی برایش نیست.",
  },
  {
    // TODO: Arka asked for Android apps. The repo has no Android project, product, or post.
    title: "اپلیکیشن اندروید",
    body: "ساخت اپ اندروید. این را هم آرکا گفته و در مخزن هنوز نمونه‌ای ثبت نشده.",
  },
];

export function Skills() {
  return (
    <section id="skills" className="site-container scroll-mt-20 py-16 md:py-24">
      <div className="max-w-2xl">
        <h2 className="text-[28px] font-semibold tracking-tight text-foreground md:text-[36px]">مهارت‌ها</h2>
        <p className="mt-3 text-[15px] leading-8 text-muted">
          کارهایی که از بیو، دسته‌ها و محتوای همین سایت درمی‌آید. دو مورد آخر را جدا علامت زدم چون در مخزن سندی ندارند.
        </p>
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
