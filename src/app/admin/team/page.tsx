import { TeamTable } from "@/components/admin/TeamTable";
import { PageHeader } from "@/components/layout/Page";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AdminTeamPage() {
  return (
    <section>
      <PageHeader title="تیم و نقش‌ها" description="همکاران را برای ورود به workspace.arkasalehi.com مشخص کنید." />
      <GlassCard>
        <TeamTable />
      </GlassCard>
    </section>
  );
}
