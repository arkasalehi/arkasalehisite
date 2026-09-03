import { Button } from "@/components/ui/Button";

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
    <div className="glass rounded-[1.5rem] px-6 py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      {description ? <p className="mt-2 text-sm leading-7 text-muted">{description}</p> : null}
      {href ? (
        <div className="mt-5">
          <Button href={href} variant="ghost">
            {action ?? "مشاهده"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
