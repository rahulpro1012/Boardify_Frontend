import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
type AuthState = {
  accessToken: string | null;
  userEmail: string | null;
  loading: boolean;
  error?: string | null;
};
const initialState: AuthState = {
  accessToken: null,
  userEmail: null,
  loading: false,
  error: null,
};
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.error = null;
    },
    setUser(state, action: PayloadAction<{ email: string } | null>) {
      state.userEmail = action.payload?.email ?? null;
    },
    logoutLocal(state) {
      state.accessToken = null;
      state.userEmail = null;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});
export const authActions = slice.actions;
export default slice.reducer;
