import { json } from "@/lib/http";

export const runtime = "nodejs";

function gone() {
  return json({ error: "فروشگاه برداشته شده است." }, 410);
}

export function GET() {
  return gone();
}

export function PUT() {
  return gone();
}
