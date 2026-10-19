import { PricingEditor } from "@/components/admin/PricingEditor";
import { getSiteCms } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const cms = await getSiteCms();
  return (
    <section>
      <h1 className="text-[28px] font-semibold tracking-tight">قیمت‌ها</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
        حداکثر سه بسته. مبلغ خالی یعنی «توافقی». ذخیره اینجا همان کارت‌های صفحهٔ اول را عوض می‌کند.
      </p>
      <div className="mt-6">
        <PricingEditor initial={cms.pricing} />
      </div>
    </section>
  );
}
