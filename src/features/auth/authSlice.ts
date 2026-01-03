import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/apiClient";

// 1. Define the User Shape (Matches what your backend sends)
export type UserDto = {
  id: number;
  username: string;
  email: string;
  role?: string;
};

// 2. Define the State Interface
// We replaced 'userEmail' with 'user' so we can store the whole profile
export type AuthState = {
  user: UserDto | null;
  token: string | null;
  loading: boolean;
  error?: string | null;
};

// 3. Initial State
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"), // Check local storage on load
  loading: false,
  error: null,
};

// 4. Thunk to Fetch Profile from Backend
export const fetchCurrentUser = createAsyncThunk("auth/fetchMe", async () => {
  // Calls your backend to get { id, username, email, role }
  const resp = await api.get<UserDto>("/api/me");
  return resp.data;
});

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Sets token and saves to localStorage
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      localStorage.setItem("token", action.payload);
      state.error = null;
    },
    // Clears everything on logout
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("token");
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle the async fetchCurrentUser
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        // This is the magic part: we store the WHOLE user object
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load profile";
      });
  },
});

export const { setToken, logout, setLoading, setError } = slice.actions;
export default slice.reducer;
