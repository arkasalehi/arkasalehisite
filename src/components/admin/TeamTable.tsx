"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Row = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: string;
};

export function TeamTable() {
  const [users, setUsers] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا");
        setUsers([]);
        return;
      }
      setError("");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      setError("فهرست کاربران بارگذاری نشد.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setRole(userId: string, role: string) {
    setError("");
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-rose-400" role="alert">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">در حال بارگذاری کاربران…</p> : null}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[520px] text-right text-sm">
          <thead className="text-muted">
            <tr>
              <th className="p-2 font-medium">نام</th>
              <th className="p-2 font-medium">ایمیل</th>
              <th className="p-2 font-medium">نقش</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !users.length ? (
              <tr>
                <td colSpan={3} className="p-4 text-muted">
                  {error ? "فهرست کاربران در دسترس نیست." : "کاربری ثبت نشده."}
                </td>
              </tr>
            ) : null}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[var(--border)]">
                <td className="p-2">{u.display_name}</td>
                <td className="p-2 dir-ltr text-left">{u.email}</td>
                <td className="p-2">
                  <select
                    className="field py-1"
                    value={u.role}
                    onChange={(e) => void setRole(u.id, e.target.value)}
                  >
                    <option value="user">کاربر</option>
                    <option value="collaborator">همکار</option>
                    <option value="admin">ادمین</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">فقط نقش همکار (و ادمین) به ورک‌اسپیس دسترسی دارند. بقیه به سایت اصلی می‌روند.</p>
      <Button href={"/admin"} variant="ghost">
        بازگشت
      </Button>
    </div>
  );
}
