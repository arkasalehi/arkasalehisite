import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashNav } from "@/components/layout/DashNav";

const items = [
  { href: "/admin", label: "نمای کلی" },
  { href: "/admin/posts", label: "محتوا" },
  { href: "/admin/products", label: "محصولات" },
  { href: "/admin/comments", label: "نظرها" },
  { href: "/admin/settings", label: "تنظیمات سایت" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <DashNav items={items} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
