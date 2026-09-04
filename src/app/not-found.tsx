import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight">صفحه پیدا نشد</h1>
      <p className="mt-3 text-muted">این مسیر وجود ندارد یا محتوا هنوز منتشر نشده.</p>
      <Link href="/" className="mt-6 inline-block text-accent">
        بازگشت به خانه
      </Link>
    </div>
  );
}
