const TOKEN_KEY = "mdkp_token";
const USER_KEY = "mdkp_user";

export type StoredUser = {
  id: number;
  email: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  phone: string;
  date_of_birth: string;
  is_active?: boolean;
  role?: string;
  role_id?: number;
  token?: string;
};

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser | null) {
  if (!user) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(user));
}

