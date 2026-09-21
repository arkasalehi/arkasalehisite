import { requireAdmin } from "@/lib/auth/session";
import { getSiteCms, saveSiteCms } from "@/lib/data/settings";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { resolveHeroWeather } from "@/lib/cms/heroWeather";
import { siteCmsSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return json({ cms: await getSiteCms() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await guardMutation(request, "admin-settings", 20);
    await requireAdmin();
    const parsed = siteCmsSchema.parse(await request.json());
    await saveSiteCms({
      ...parsed,
      hero: parsed.hero
        ? { ...parsed.hero, weather: resolveHeroWeather(parsed.hero.weather) }
        : undefined,
    });
    return json({ ok: true, cms: await getSiteCms() });
  } catch (error) {
    return errorResponse(error);
  }
}
