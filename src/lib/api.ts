import { getStoredToken, setStoredToken, setStoredUser } from "./storage";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(path, API_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function parseJsonSafely(resp: Response): Promise<unknown> {
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const m = /filename\\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i.exec(header);
  const raw = m?.[1] ?? m?.[2];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { query?: Record<string, string | number | undefined> }
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options?.headers ?? {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(buildUrl(path, options?.query), {
    ...options,
    headers
  });

  if (resp.status === 401) {
    setStoredToken(null);
    setStoredUser(null);
  }

  if (!resp.ok) {
    const body = await parseJsonSafely(resp);
    throw new ApiError(`API error (${resp.status})`, resp.status, body);
  }

  const contentType = resp.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await resp.json()) as T;
  }

  return (await (resp.text() as unknown)) as T;
}

export type User = {
  id: number;
  last_name: string;
  first_name: string;
  middle_name: string;
  phone: string;
  date_of_birth: string;
  email: string;
  token?: string;
  is_active?: boolean;
  role?: string;
  role_id?: number;
};

export type Role = { id: number; title: string; description: string };
export type Status = { id: number; title: string; description: string };

export type Task = {
  id: number;
  title: string;
  description: string;
  date_created: string;
  date_deadline: string;
  date_closed: string;
  priority: number;
  id_creator: number;
  id_redactor: number;
  id_author: number;
  id_status: number;
};

export type Version = {
  id: number;
  number_version: number;
  date_created: string;
  title: string;
  description: string;
  creator_id: number;
  task_id: number;
};

export type Revision = {
  id: number;
  date_created: string;
  title: string;
  description: string;
  creator_id: number;
  version_id: number;
  status_id: number;
};

export type Material = {
  id: number;
  title: string;
  extension: string;
  description: string;
  creator_id: number;
  task_id: number;
  version_id: number;
};

export type Log = {
  id: number;
  date_created: string;
  action: string;
  user_id: number;
};

export const api = {
  health: () => apiFetch<{ status: "ok" }>("/health"),

  login: (email: string, password: string) =>
    apiFetch<User>("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }),

  myAccount: () => apiFetch<User>("/account/my"),

  changePassword: (old_password: string, new_password: string, new_password_confirm: string) => {
    const body = new FormData();
    body.set("old_password", old_password);
    body.set("new_password", new_password);
    body.set("new_password_confirm", new_password_confirm);
    return apiFetch<{ status: "ok" }>("/account/password", { method: "PUT", body });
  },

  activityLogs: (query?: {
    email?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) => apiFetch<Log[]>("/activitylog", { query }),

  users: () => apiFetch<User[]>("/user/list"),

  createUser: (payload: {
    last_name: string;
    first_name: string;
    middle_name: string;
    phone: string;
    date_of_birth: string;
    email: string;
    password: string;
    role: string;
  }) =>
    apiFetch<User>("/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  toggleUserActive: (email: string) =>
    apiFetch<{ status: "ok" }>("/user/active", { method: "PUT", query: { email } }),

  updateUserRole: (email: string, roleID: number) =>
    apiFetch<{ status: "ok" }>("/user/role", { method: "PUT", query: { email, roleID } }),

  roles: () => apiFetch<Role[]>("/roles"),
  statuses: () => apiFetch<Status[]>("/status"),

  findUsers: (query: { role?: string; email?: string; last_name?: string; first_name?: string }) =>
    apiFetch<User[]>("/finduser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query)
    }),

  createTask: (payload: {
    title: string;
    description: string;
    date_deadline?: string;
    priority: number;
    id_author?: number;
    id_redactor?: number;
  }) =>
    apiFetch<Task>("/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  deleteTask: (id: number) => apiFetch<{ status: "ok" }>(`/task/${id}`, { method: "DELETE" }),
  task: (id: number) => apiFetch<Task>(`/task/${id}`),
  taskList: () => apiFetch<Task[]>("/task/list"),

  updateTaskStatus: (id: number, status: string) => {
    const body = new FormData();
    body.set("status", status);
    return apiFetch<{ status: "ok" }>(`/task/${id}/status`, { method: "PUT", body });
  },

  uploadMaterialToTask: (taskId: number, file: File, description: string) => {
    const body = new FormData();
    body.set("file", file);
    body.set("description", description);
    return apiFetch<{ status: "ok" }>(`/material/${taskId}`, { method: "POST", body });
  },
  material: (id: number) => apiFetch<Material>(`/material/${id}`),
  materialsByTask: (taskId: number) => apiFetch<Material[]>(`/material/list/${taskId}`),
  downloadMaterialUrl: (id: number) => buildUrl(`/material/download/${id}`),
  downloadMaterial: async (id: number) => {
    const token = getStoredToken();
    const resp = await fetch(buildUrl(`/material/download/${id}`), {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!resp.ok) {
      const body = await parseJsonSafely(resp);
      throw new ApiError(`API error (${resp.status})`, resp.status, body);
    }
    const blob = await resp.blob();
    const filename =
      getFilenameFromContentDisposition(resp.headers.get("content-disposition")) ?? `material-${id}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  createVersion: (taskId: number, payload: { title: string; description: string; number_version: number; date_created: string }) =>
    apiFetch<Version>(`/version/${taskId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  versions: (taskId: number) => apiFetch<Version[]>(`/version/list/${taskId}`),
  version: (id: number) => apiFetch<Version>(`/version/${id}`),

  createEdit: (versionId: number, payload: { title: string; description: string; status_id: number; date_created: string }) =>
    apiFetch<Revision>(`/edit/${versionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  edits: (versionId: number) => apiFetch<Revision[]>(`/edit/list/${versionId}`),
  edit: (id: number) => apiFetch<Revision>(`/edit/${id}`),
  updateEditStatus: (id: number, status: string) => {
    const body = new FormData();
    body.set("status", status);
    return apiFetch<{ status: "ok" }>(`/edit/${id}/status`, { method: "PUT", body });
  }
};
