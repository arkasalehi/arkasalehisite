"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ProfileForm({ displayName, bio }: { displayName: string; bio?: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(form.get("displayName")),
        bio: String(form.get("bio") || "") || null,
      }),
    });
    setMessage(res.ok ? "ذخیره شد" : "خطا");
    router.refresh();
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={onSubmit}>
      <input name="displayName" defaultValue={displayName} className="field" />
      <textarea name="bio" defaultValue={bio ?? ""} placeholder="بیو" className="field min-h-28" />
      <Button type="submit">ذخیره</Button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-sm text-muted"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      خروج
    </button>
  );
}
