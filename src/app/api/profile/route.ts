import { requireUser } from "@/lib/auth/session";
import { getProfile, updateProfile } from "@/lib/data/users";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { sanitizeText } from "@/lib/security";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  displayName: z.string().min(2).max(48).optional(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9._]+$/)
    .optional(),
  bio: z.string().max(400).optional().nullable(),
  avatarUrl: z.string().min(8).max(2000).nullable().optional(),
});

export async function GET() {
  try {
    const session = await requireUser();
    const profile = await getProfile(session.id);
    return json({
      user: {
        id: session.id,
        email: session.email,
        username: profile?.username ?? session.username,
        displayName: profile?.displayName ?? session.displayName,
        role: session.role,
        avatarUrl: profile?.avatarUrl ?? session.avatarUrl,
        bio: profile?.bio ?? null,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await guardMutation(request, "profile", 20);
    const session = await requireUser();
    const input = schema.parse(await request.json());
    const user = await updateProfile(session.id, {
      displayName: input.displayName ? sanitizeText(input.displayName, 48) : undefined,
      username: input.username ? sanitizeText(input.username, 24).toLowerCase() : undefined,
      bio: input.bio === undefined ? undefined : input.bio ? sanitizeText(input.bio, 400) : null,
      avatarUrl: input.avatarUrl,
    });
    return json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CONFLICT") {
      return json({ error: "This username is taken" }, 409);
    }
    return errorResponse(error);
  }
}
