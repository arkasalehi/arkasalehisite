"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    const confirm = String(new FormData(form).get("confirm") ?? "");
    if (password !== confirm) {
      setError("رمز و تکرار آن یکی نیستند");
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    form.reset();
    setMessage("رمز به‌روز شد");
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={onSubmit}>
      <input name="password" type="password" required minLength={8} placeholder="رمز جدید" className="field" />
      <input name="confirm" type="password" required minLength={8} placeholder="تکرار رمز" className="field" />
      <Button type="submit">تغییر رمز</Button>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
