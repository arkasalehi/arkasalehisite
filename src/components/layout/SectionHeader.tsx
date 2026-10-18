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
              ? "text-[22px] font-semibold tracking-tight text-foreground md:text-[28px]"
              : "text-[32px] font-semibold tracking-tight md:text-[44px]"
          }
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-1 max-w-xl text-sm leading-6 text-muted", saas ? "" : "mt-2 leading-7")}>{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className={
            saas
              ? "sb-btn sb-btn-secondary mb-0.5 h-8 shrink-0 px-3 text-[13px]"
              : "mb-1 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
          }
        >
          {action}
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
