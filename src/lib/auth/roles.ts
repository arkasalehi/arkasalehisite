import type { Role } from "@/lib/types";

/** Server and client: accept both legacy enum (ADMIN) and current text (admin). */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "ADMIN";
}

export function isCollaboratorRole(role: string | null | undefined): boolean {
  return role === "collaborator" || role === "COLLABORATOR";
}

/** Admin and collaborator can enter the workspace. Regular users cannot. */
export function canAccessWorkspace(role: string | null | undefined): boolean {
  return isAdminRole(role) || isCollaboratorRole(role);
}

export function normalizeRole(role: unknown): Role {
  const value = typeof role === "string" ? role : "";
  if (isAdminRole(value)) return "admin";
  if (isCollaboratorRole(value)) return "collaborator";
  return "user";
}
