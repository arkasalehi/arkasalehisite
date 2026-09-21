import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/content/CoverImage";

export function EmptyState({
  title,
  description,
  href,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  href?: string;
  action?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-[#e8ece6] bg-white/85 px-5 py-8 text-center shadow-[0_12px_32px_rgba(20,60,100,0.06)] sm:flex-row sm:justify-between sm:text-start">
        <div>
          <p className="text-[16px] font-semibold tracking-tight text-[#1e2a24]">{title}</p>
          {description ? <p className="mt-1 text-sm leading-7 text-[#8b938d]">{description}</p> : null}
        </div>
        {href ? (
          <Button href={href} variant="ghost" className="shrink-0">
            {action ?? "مشاهده"}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <div className="editorial-media relative h-44 w-full">
        <CoverImage src={null} alt="" seed={title} kind="interior" sizes="100vw" />
      </div>
      <div className="px-6 py-10 text-center">
        <p className="text-xl font-semibold tracking-tight">{title}</p>
        {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">{description}</p> : null}
        {href ? (
          <div className="mt-5">
            <Button href={href} variant="ghost">
              {action ?? "مشاهده"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
