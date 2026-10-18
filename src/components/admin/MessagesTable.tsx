"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

export type ContactRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function MessagesTable({ rows, missing }: { rows: ContactRow[]; missing: boolean }) {
  const [items, setItems] = useState(rows);
  const [error, setError] = useState("");

  async function mark(id: string, read: boolean) {
    setError("");
    const res = await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    if (!res.ok) {
      setError("وضعیت ذخیره نشد");
      return;
    }
    setItems((list) => list.map((row) => (row.id === id ? { ...row, read } : row)));
  }

  if (missing) {
    return (
      <p className="rounded-xl border border-border bg-card p-5 text-sm leading-7 text-muted">
        جدول پیام‌ها هنوز ساخته نشده. مهاجرت <span className="font-mono">20261018120000_site_admin_contact.sql</span> را در سوپابیس اجرا کنید.
      </p>
    );
  }

  if (!items.length) {
    return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">هنوز پیامی نرسیده.</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {items.map((row) => (
          <li key={row.id} className="grid gap-2 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {row.name}{" "}
                <span className="font-normal text-muted">{row.read ? "خوانده شده" : "جدید"}</span>
              </p>
              <a href={`mailto:${row.email}`} className="text-sm text-muted hover:text-foreground">
                {row.email}
              </a>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{row.message}</p>
              <p className="mt-2 text-xs text-muted">{formatDate(row.created_at)}</p>
            </div>
            <button type="button" className="sb-btn sb-btn-secondary h-9 px-3 text-[13px]" onClick={() => mark(row.id, !row.read)}>
              {row.read ? "علامت نخوانده" : "خواندم"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
