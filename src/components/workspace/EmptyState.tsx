"use client";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid h-full min-h-48 place-items-center px-[var(--ws-space-6)] py-[var(--ws-space-7)] text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-[var(--ws-radius)] bg-[var(--ws-accent-muted)] text-[var(--ws-accent)]">{icon}</span>
        <h2 className="mt-[var(--ws-space-4)] text-[length:var(--ws-type-lg)] font-semibold text-[var(--theme-caption-color)]">{title}</h2>
        <p className="mt-[var(--ws-space-2)] text-[length:var(--ws-type-sm)] text-[var(--theme-darker-color)]">{body}</p>
        {action ? <div className="mt-[var(--ws-space-4)] flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
