"use client";

import { useRouter } from "next/navigation";

export function DeleteButton({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-rose-300"
      onClick={async () => {
        if (!confirm("حذف شود؟")) return;
        await fetch(endpoint, { method: "DELETE" });
        router.refresh();
      }}
    >
      حذف
    </button>
  );
}
