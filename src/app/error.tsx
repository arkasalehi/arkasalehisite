"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">خطایی رخ داد</h1>
      <p className="mt-2 text-slate-400">اگر دیتابیس تنظیم نشده، فایل README را ببینید.</p>
      <button type="button" onClick={reset} className="mt-6 text-cyan-300">
        تلاش دوباره
      </button>
    </div>
  );
}
