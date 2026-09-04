import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "@/components/icons";

export function SectionHeader({
  title,
  href,
  action = "همه",
  description,
}: {
  title: string;
  href?: string;
  action?: string;
  description?: string;
}) {
  return (
    <div className={cn("mb-10 flex items-end justify-between gap-6")}>
      <div className="min-w-0">
        <h2 className="text-[32px] font-extrabold tracking-tight md:text-[44px]">{title}</h2>
        {description ? <p className="mt-2 max-w-xl text-sm leading-7 text-muted">{description}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="mb-1 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground"
        >
          {action}
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
