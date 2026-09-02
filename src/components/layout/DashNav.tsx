import Link from "next/link";
import { cn } from "@/lib/utils";

export function DashNav({
  items,
}: {
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <aside className="glass h-fit rounded-3xl p-3 md:w-56">
      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-2xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
