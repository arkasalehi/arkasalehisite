import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "lg" ? 80 : size === "sm" ? 32 : 40;
  const dim = size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const initial = name.trim().slice(0, 1);

  if (src) {
    return (
      <Image src={src} alt={name} width={px} height={px} className={cn("rounded-full object-cover", dim)} />
    );
  }

  return (
    <span className={cn("grid place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 font-semibold text-slate-950", dim)}>
      {initial}
    </span>
  );
}
