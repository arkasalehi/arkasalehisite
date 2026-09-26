import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "@/components/icons";

export function SectionHeader({
  title,
  href,
  action = "همه",
  description,
  tone = "editorial",
}: {
  title: string;
  href?: string;
  action?: string;
  description?: string;
  tone?: "editorial" | "saas";
}) {
  const saas = tone === "saas";
  return (
    <div className={cn("flex items-center justify-between gap-4", saas ? "mb-4" : "mb-10 items-end gap-6")}>
      <div className="min-w-0">
        <h2
          className={
            saas
              ? "text-[22px] font-semibold tracking-tight text-[#1e2a24] md:text-[28px]"
              : "text-[32px] font-extrabold tracking-tight md:text-[44px]"
          }
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-1 max-w-xl text-sm leading-6", saas ? "text-[#8b938d]" : "mt-2 leading-7 text-muted")}>{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className={
            saas
              ? "mb-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e4e9ee] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#3390ec] transition-colors hover:border-[#3390ec]/25"
              : "mb-1 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground"
          }
        >
          {action}
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
