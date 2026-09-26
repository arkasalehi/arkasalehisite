import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { listCollaboratorDirectory } from "@/lib/data/workspace";
import { errorResponse, json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const people = await listCollaboratorDirectory();
    return json({
      people: people
        .filter((p) => p.id !== session.id)
        .map((p) => ({ id: p.id, displayName: p.displayName || p.username, avatarUrl: p.avatarUrl })),
    });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
