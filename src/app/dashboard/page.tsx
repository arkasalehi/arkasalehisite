import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { getProfile } from "@/lib/data/users";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const user = await getProfile(session.id);
  if (!user) return null;

  return (
    <section>
      <PageHeader
        title={user.displayName}
        description={user.email}
        actions={
          <>
            {isAdminRole(user.role) ? <Button href="/admin" variant="ghost">پنل ادمین</Button> : null}
            <LogoutButton />
          </>
        }
      />
      <GlassCard className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-medium">{user.displayName}</p>
            {isAdminRole(user.role) ? (
              <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs text-muted">ادمین</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
      </GlassCard>
      <GlassCard>
        <h2 className="text-lg font-medium">اطلاعات پروفایل</h2>
        <div className="mt-4">
          <ProfileForm displayName={user.displayName} bio={user.bio} />
        </div>
      </GlassCard>
    </section>
  );
}
