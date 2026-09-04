import { getSiteCms } from "@/lib/data/settings";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { PageHeader } from "@/components/layout/Page";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const cms = await getSiteCms();
  return (
    <section>
      <PageHeader title="تنظیمات سایت" description="محتوای صفحه نخست، سئو، فوتر و مسیر شروع از اینجا می‌آید." />
      <div className="mt-6">
        <SettingsEditor initial={cms} />
      </div>
    </section>
  );
}
