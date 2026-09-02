import Link from "next/link";
import { cn } from "@/lib/utils";

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
    <div className={cn("mb-5 flex items-end justify-between gap-4")}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-sm text-accent">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
