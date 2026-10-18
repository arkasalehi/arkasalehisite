import type { Metadata } from "next";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";

export const metadata: Metadata = {
  title: { absolute: "صفحه پیدا نشد" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <p className="text-sm font-medium text-muted">۴۰۴</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">صفحه پیدا نشد</h1>
      <p className="mt-3 text-muted">این مسیر وجود ندارد یا محتوا هنوز منتشر نشده.</p>
      <Link href="/" className="sb-btn sb-btn-primary mx-auto mt-6 h-10 px-4">
        بازگشت به خانه
      </Link>
    </div>
  );
}
