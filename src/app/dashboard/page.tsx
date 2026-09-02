import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const user = await getDb().user.findUnique({ where: { id: session.id } });
  if (!user) return null;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">پروفایل</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-slate-400">{user.email}</p>
      <div className="mt-6">
        <ProfileForm displayName={user.displayName} bio={user.bio} />
      </div>
    </section>
  );
}
