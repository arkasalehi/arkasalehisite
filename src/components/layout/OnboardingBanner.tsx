"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

const KEY = "as_onboarded";

export function OnboardingBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(false);
    }
  }, []);

  if (!show || pathname === "/") return null;

  return (
    <div className="surface mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] p-4">
      <div>
        <p className="font-medium">خوش آمدید</p>
        <p className="text-sm text-muted">از بخش «از اینجا شروع کنید» مسیر کوتاه را دنبال کنید، یا وبلاگ را باز کنید.</p>
      </div>
      <div className="flex gap-2">
        <Button href="/blog" className="py-1.5 text-xs">
          وبلاگ
        </Button>
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs text-muted hover:text-foreground"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setShow(false);
          }}
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
