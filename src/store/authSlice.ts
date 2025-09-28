import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AdminSession = {
  id: string;
  email: string;
  roles: string[];
};

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  admin: AdminSession | null;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  admin: null,
};

type TokenPayload = {
  accessToken: string;
  refreshToken: string;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<TokenPayload>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setAdmin: (state, action: PayloadAction<AdminSession | null>) => {
      state.admin = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.admin = null;
    },
  },
});

export const { setTokens, setAdmin, logout } = authSlice.actions;
export default authSlice.reducer;
