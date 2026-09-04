"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-medium">خطایی رخ داد</h1>
      <p className="mt-2 text-muted">اگر دیتابیس تنظیم نشده، فایل README را ببینید.</p>
      <button type="button" onClick={reset} className="mt-6 text-sm font-medium text-foreground underline-offset-4 hover:underline">
        تلاش دوباره
      </button>
    </div>
  );
}
