import { MessagesTable, type ContactRow } from "@/components/admin/MessagesTable";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let rows: ContactRow[] = [];
  let missing = false;
  try {
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("contact_messages")
      .select("id, name, email, message, read, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) missing = true;
    else rows = (data ?? []) as ContactRow[];
  } catch {
    missing = true;
  }

  return (
    <section>
      <h1 className="text-[28px] font-semibold tracking-tight">پیام‌ها</h1>
      <p className="mt-2 text-sm text-muted">فرم تماس صفحهٔ اول. فقط ادمین این فهرست را می‌بیند.</p>
      <div className="mt-6">
        <MessagesTable rows={rows} missing={missing} />
      </div>
    </section>
  );
}
