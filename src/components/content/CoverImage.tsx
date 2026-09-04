import Image from "next/image";
import { coverSrc, type SampleKind } from "@/lib/media";
import { cn } from "@/lib/utils";

export function CoverImage({
  src,
  alt,
  seed,
  kind = "blog",
  className,
  sizes = "100vw",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  seed: string;
  kind?: SampleKind;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={coverSrc(src, seed, kind)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
