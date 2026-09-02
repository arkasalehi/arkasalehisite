import { getSession, issueAuth } from "@/lib/auth/session";
import { hashPassword, passwordNeedsRehash, verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/db/users";
import { getDb } from "@/lib/db/client";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "login", 8);
    const body = loginSchema.parse(await request.json());
    const user = await findUserByEmail(body.email);
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return json({ error: "ایمیل یا رمز عبور نادرست است" }, 401);
    }

    if (passwordNeedsRehash(user.passwordHash)) {
      await getDb().user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(body.password) },
      });
    }

    const session = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
    await issueAuth(session);
    return json({ user: session });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return json({ user: null }, 401);
  return json({ user: session });
}
