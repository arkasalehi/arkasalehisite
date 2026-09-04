"use client";

import { ShareIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toaster";

export function ShareButton({ title }: { title: string }) {
  const { push } = useToast();

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      push("لینک کپی شد");
    } catch {
      /* user cancelled */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-foreground/5 px-3 py-1.5 text-sm transition duration-200 hover:border-foreground/30"
    >
      <ShareIcon className="h-4 w-4" />
      اشتراک
    </button>
  );
}
