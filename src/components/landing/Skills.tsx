import { siteConfig } from "@/lib/config";
import { ArrowUp, SkillGlyph } from "@/components/landing/marks";

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

const HIGHLIGHTS = ["شخصی", "انتشار", "طراحی", "محتوا", "وب"];

function featureLine(bio: string) {
  const parts = bio
    .split(/(?<=[.!؟])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const line = (parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "").replace(/[.!؟]\s*$/, "");
  return line;
}

function Emphasized({ text }: { text: string }) {
  const word = HIGHLIGHTS.find((item) => text.includes(item));
  if (!word) return text;
  const index = text.indexOf(word);
  return (
    <>
      {text.slice(0, index)}
      <span className="ph-em">{word}</span>
      {text.slice(index + word.length)}
    </>
  );
}

function SkillCard({ title, body, index }: { title: string; body: string; index: number }) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <article className="ph-skill">
      <span className="ph-skill-no" dir="ltr">
        /{number}
      </span>
      <SkillGlyph index={index} />
      <h3>{title}</h3>
      <p className="ph-muted">{body}</p>
    </article>
  );
}

export function Skills({ bio, cta }: { bio: string; cta: string }) {
  const lead = SKILLS.slice(0, 3);
  const rest = SKILLS.slice(3);
  const statement = featureLine(bio) || featureLine(siteConfig.bio);

  return (
    <section id="skills" className="ph-section">
      <div className="site-container">
        <div className="ph-feature">
          <div className="ph-skill-col">
            {lead.map((skill, index) => (
              <SkillCard key={skill.title} index={index} title={skill.title} body={skill.body} />
            ))}
          </div>
          <div className="ph-feature-copy">
            <span className="ph-tag">مهارت</span>
            {statement ? (
              <p className="ph-statement">
                <Emphasized text={statement} />
              </p>
            ) : null}
            <div className="ph-feature-actions">
              <a className="ph-btn ph-btn-blue" href="#contact">
                {cta || "سفارش پروژه"}
              </a>
              <a className="ph-icon-btn" href="#work" aria-label="دیدن کارها">
                <ArrowUp />
              </a>
            </div>
          </div>
        </div>
        <div className="ph-skill-rest">
          {rest.map((skill, index) => (
            <SkillCard key={skill.title} index={index + 3} title={skill.title} body={skill.body} />
          ))}
        </div>
      </div>
    </section>
  );
}
