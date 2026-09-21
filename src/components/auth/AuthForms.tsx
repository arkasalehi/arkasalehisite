"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { safeInternalPath } from "@/lib/auth/paths";
import { workspaceUrl } from "@/lib/runtime";

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const next = safeInternalPath(useSearchParams().get("next"), "/dashboard");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
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
    if (data.needsConfirmation) {
      setNotice(data.message ?? "حساب ساخته شد. ایمیل تأیید را چک کنید.");
      return;
    }
    if (next.startsWith("/ws")) {
      if (canAccessWorkspace(data.user?.role)) {
        window.location.href = workspaceUrl();
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <GlassCard className="mx-auto max-w-md p-8">
      <p className="text-sm font-medium text-muted">حساب کاربری</p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{mode === "login" ? "ورود" : "ثبت‌نام"}</h1>
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
        {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          {mode === "login" ? "ورود" : "ساخت حساب"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        {mode === "login" ? (
          <>
            <a href="/forgot-password" className="text-accent">
              رمز را فراموش کرده‌اید؟
            </a>
            <span className="mx-2">·</span>
            <a href="/register" className="text-accent">
              حساب ندارید؟ ثبت‌نام
            </a>
          </>
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

export function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    setNotice(data.message ?? "اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود.");
  }

  return (
    <GlassCard className="mx-auto max-w-md p-8">
      <h1 className="text-[28px] font-semibold tracking-tight">بازیابی رمز</h1>
      <p className="mt-2 text-sm leading-7 text-muted">ایمیل حساب را وارد کنید تا لینک بازنشانی ارسال شود.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input name="email" type="email" required placeholder="ایمیل" />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          ارسال لینک
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <a href="/login" className="text-accent">
          بازگشت به ورود
        </a>
      </p>
    </GlassCard>
  );
}

export function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setLoading(false);
      setError("رمز و تکرار آن یکی نیستند");
      return;
    }
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <GlassCard className="mx-auto max-w-md p-8">
      <h1 className="text-[28px] font-semibold tracking-tight">رمز تازه</h1>
      <p className="mt-2 text-sm leading-7 text-muted">پس از باز کردن لینک ایمیل، رمز جدید را تنظیم کنید.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input name="password" type="password" required minLength={8} placeholder="رمز جدید" />
        <Input name="confirm" type="password" required minLength={8} placeholder="تکرار رمز" />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" loading={loading} className="w-full">
          ذخیره رمز
        </Button>
      </form>
    </GlassCard>
  );
}
