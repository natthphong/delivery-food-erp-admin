import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminProfile, PermissionItem } from "@/types/auth";

type AuthUser = Pick<AdminProfile, "id" | "email" | "username" | "roles">;

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  permissions: PermissionItem[];
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  permissions: [],
};

const STORAGE_KEY = "baanconsole.auth.v1";

function loadState(): AuthState {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }
    const parsed = JSON.parse(raw) as Partial<AuthState> | null;
    if (!parsed) {
      return initialState;
    }

    return {
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken : null,
      refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
      user: parsed.user ?? null,
      permissions: Array.isArray(parsed.permissions) ? (parsed.permissions as PermissionItem[]) : [],
    };
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return initialState;
  }
}

function persistState(state: AuthState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
      permissions: state.permissions,
    })
  );
}

const slice = createSlice({
  name: "auth",
  initialState: loadState(),
  reducers: {
    setAuth(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        admin: AuthUser & { permissions: PermissionItem[] };
      }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = {
        id: action.payload.admin.id,
        email: action.payload.admin.email,
        username: action.payload.admin.username,
        roles: action.payload.admin.roles,
      };
      state.permissions = action.payload.admin.permissions ?? [];
      persistState(state);
    },
    setMe(state, action: PayloadAction<{ admin: AdminProfile }>) {
      const profile = action.payload.admin;
      state.user = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        roles: profile.roles,
      };
      state.permissions = profile.permissions ?? [];
      persistState(state);
    },
    updateTokens(state, action: PayloadAction<{ accessToken: string; refreshToken?: string | null }>) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
      }
      persistState(state);
    },
    signOut() {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return { ...initialState };
    },
  },
});

export const { setAuth, setMe, updateTokens, signOut } = slice.actions;
export default slice.reducer;
