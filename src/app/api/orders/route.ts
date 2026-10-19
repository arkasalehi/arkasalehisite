import { json } from "@/lib/http";

export const runtime = "nodejs";

export function POST() {
  return json({ error: "فروشگاه برداشته شده است." }, 410);
}
