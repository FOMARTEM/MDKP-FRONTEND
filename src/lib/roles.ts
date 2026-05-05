export function normalizeRole(role?: string): string {
  return (role ?? "").trim().toLowerCase();
}

export function isAdmin(role?: string): boolean {
  const r = normalizeRole(role);
  return r.includes("admin") || r.includes("админ") || r.includes("administrator");
}

export function isManager(role?: string): boolean {
  const r = normalizeRole(role);
  return r.includes("manager") || r.includes("руковод") || r.includes("leader");
}

export function isEditor(role?: string): boolean {
  const r = normalizeRole(role);
  return r.includes("editor") || r.includes("редакт");
}

export function isAuthor(role?: string): boolean {
  const r = normalizeRole(role);
  return r.includes("author") || r.includes("автор");
}

