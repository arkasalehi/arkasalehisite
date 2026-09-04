import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/content/CoverImage";

export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="surface overflow-hidden">
      <div className="editorial-media relative h-44 w-full">
        <CoverImage src={null} alt="" seed={title} kind="interior" sizes="100vw" />
      </div>
      <div className="px-6 py-10 text-center">
        <p className="text-xl font-extrabold tracking-tight">{title}</p>
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
