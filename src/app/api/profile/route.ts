import { requireUser } from "@/lib/auth/session";
import { updateProfile } from "@/lib/data/users";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  displayName: z.string().min(2).max(48),
  bio: z.string().max(400).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    guardMutation(request, "profile", 20);
    const session = await requireUser();
    const input = schema.parse(await request.json());
    const user = await updateProfile(session.id, {
      displayName: sanitizeText(input.displayName, 48),
      bio: input.bio ? sanitizeText(input.bio, 400) : input.bio,
    });
    return json({
      user: {
        id: user.id,
        displayName: user.displayName,
        bio: user.bio,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
