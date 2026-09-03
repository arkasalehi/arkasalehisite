import { getSession } from "@/lib/auth/session";
import { getProfile } from "@/lib/data/users";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const user = await getProfile(session.id);
  if (!user) return null;

  return (
    <section className="space-y-6">
      <GlassCard className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />
          <div>
            <h1 className="text-3xl font-semibold">{user.displayName}</h1>
            <p className="mt-1 text-muted">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </GlassCard>
      <GlassCard>
        <h2 className="text-xl font-semibold">اطلاعات پروفایل</h2>
        <div className="mt-4">
          <ProfileForm displayName={user.displayName} bio={user.bio} />
        </div>
      </GlassCard>
    </section>
  );
}
