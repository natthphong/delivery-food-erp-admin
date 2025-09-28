import type { AdminSession } from "@/store/authSlice";

const AUTH_STORAGE_KEY = "baan-admin-auth";

type PersistedAuth = {
  accessToken: string;
  refreshToken: string;
  admin: AdminSession | null;
};

export const loadAuth = (): PersistedAuth | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedAuth;
    if (typeof parsed.accessToken === "string" && typeof parsed.refreshToken === "string") {
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        admin: parsed.admin ?? null,
      };
    }
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return null;
};

export const saveAuth = (payload: PersistedAuth): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
};

export const clearAuth = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export { AUTH_STORAGE_KEY };
