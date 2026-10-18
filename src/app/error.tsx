"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="text-[28px] font-semibold tracking-tight">خطایی رخ داد</h1>
      <p className="mt-2 text-muted">اگر دیتابیس تنظیم نشده، فایل README را ببینید.</p>
      <button type="button" onClick={reset} className="sb-btn sb-btn-secondary mx-auto mt-6 h-10 px-4">
        تلاش دوباره
      </button>
    </div>
  );
}
