import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashNav } from "@/components/layout/DashNav";

const items = [
  { href: "/dashboard", label: "پروفایل" },
  { href: "/dashboard/saved", label: "ذخیره‌ها" },
  { href: "/dashboard/notifications", label: "اعلان‌ها" },
  { href: "/dashboard/activity", label: "فعالیت" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <DashNav items={items} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
