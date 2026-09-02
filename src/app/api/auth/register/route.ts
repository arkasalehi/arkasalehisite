import { issueAuth } from "@/lib/auth/session";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { getDb } from "@/lib/db/client";
import { sanitizeText } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "register", 5);
    const body = registerSchema.parse(await request.json());
    const existing = await findUserByEmail(body.email);
    if (existing) return json({ error: "این ایمیل قبلاً ثبت شده" }, 409);

    const username = sanitizeText(body.username, 24).toLowerCase();
    const db = getDb();
    const usernameTaken = await db.user.findUnique({ where: { username } });
    if (usernameTaken) return json({ error: "این نام کاربری گرفته شده" }, 409);

    const user = await createUser({
      ...body,
      username,
      displayName: sanitizeText(body.displayName, 48),
    });
    const session = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
    await issueAuth(session);
    return json({ user: session }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
