import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-5 md:px-20", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-10 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow ? <p className="mb-2 text-sm text-muted">{eyebrow}</p> : null}
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-[15px] leading-8 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("mt-24 first:mt-0", className)}>{children}</section>;
}
