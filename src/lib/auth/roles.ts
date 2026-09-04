import type { Role } from "@/lib/types";

/** Server and client: accept both legacy enum (ADMIN) and current text (admin). */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "ADMIN";
}

export function normalizeRole(role: unknown): Role {
  return isAdminRole(typeof role === "string" ? role : "") ? "admin" : "user";
}
