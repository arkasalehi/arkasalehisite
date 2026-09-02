import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-4xl font-semibold">صفحه پیدا نشد</h1>
      <p className="mt-3 text-slate-400">این مسیر وجود ندارد یا محتوا هنوز منتشر نشده.</p>
      <Link href="/" className="mt-6 inline-block text-cyan-300">
        بازگشت به خانه
      </Link>
    </div>
  );
}
