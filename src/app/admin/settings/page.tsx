import { getSiteCms } from "@/lib/data/settings";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const cms = await getSiteCms();
  return (
    <section>
      <h1 className="text-3xl font-semibold">تنظیمات سایت</h1>
      <p className="mt-2 text-muted">محتوای صفحه نخست، سئو، فوتر و مسیر شروع از اینجا می‌آید.</p>
      <div className="mt-6">
        <SettingsEditor initial={cms} />
      </div>
    </section>
  );
}
