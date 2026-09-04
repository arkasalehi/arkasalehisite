"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <GlassCard className="mx-auto max-w-md p-8">
      <p className="text-sm font-medium text-muted">حساب کاربری</p>
      <h1 className="mt-1 text-4xl">{mode === "login" ? "ورود" : "ثبت‌نام"}</h1>
      <p className="mt-2 text-sm leading-7 text-muted">
        کاربران می‌توانند تعامل کنند؛ انتشار محتوا فقط با حساب ادمین است.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {mode === "register" ? (
          <>
            <Input name="displayName" required placeholder="نام نمایشی" />
            <Input name="username" required placeholder="نام کاربری" />
          </>
        ) : null}
        <Input name="email" type="email" required placeholder="ایمیل" />
        <Input name="password" type="password" required minLength={8} placeholder="رمز عبور" />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          {mode === "login" ? "ورود" : "ساخت حساب"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        {mode === "login" ? (
          <a href="/register" className="text-accent">
            حساب ندارید؟ ثبت‌نام
          </a>
        ) : (
          <a href="/login" className="text-accent">
            حساب دارید؟ ورود
          </a>
        )}
      </p>
    </GlassCard>
  );
}

export function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}

export function RegisterPage() {
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
