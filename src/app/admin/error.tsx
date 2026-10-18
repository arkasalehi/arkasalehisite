"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold">این بخش بارگذاری نشد</h1>
      <p className="mt-2 text-sm leading-7 text-muted">اگر دیتابیس در دسترس نیست، اتصال سوپابیس را چک کنید و دوباره تلاش کنید.</p>
      <button type="button" onClick={reset} className="sb-btn sb-btn-secondary mt-4 h-10 px-4">
        تلاش دوباره
      </button>
    </div>
  );
}
