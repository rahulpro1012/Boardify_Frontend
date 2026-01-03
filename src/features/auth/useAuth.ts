import { useDispatch } from "react-redux";
import { AxiosError } from "axios";
// Path: Go up 2 levels (features -> src) then into api
import api from "../../api/apiClient";

// Path: Same folder
import {
  setToken,
  logout as logoutAction,
  setLoading,
  setError,
  fetchCurrentUser,
} from "./authSlice";

// Path: Go up 2 levels (features -> src) then into app
import { type AppDispatch } from "../../app/store";

interface LoginResponse {
  token: string;
  email: string;
}

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();

  async function login(email: string, password: string): Promise<boolean> {
    dispatch(setLoading(true));
    try {
      const resp = await api.post<LoginResponse>(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );

      const { token } = resp.data;

      // 1. Save Token
      dispatch(setToken(token));

      // 2. Fetch full user profile immediately
      await dispatch(fetchCurrentUser());

      return true;
    } catch (error) {
      let errorMessage = "Login failed";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message ?? errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setError(errorMessage));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      dispatch(logoutAction());
    }
  }

  async function forgotPassword(email: string): Promise<boolean> {
    dispatch(setLoading(true));
    try {
      await api.post("/auth/forgot-password", { email });
      return true;
    } catch (error) {
      console.error("Forgot password error:", error);
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function resetPassword(
    token: string,
    newPassword: string
  ): Promise<boolean> {
    dispatch(setLoading(true));
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      return true;
    } catch (error) {
      let msg = "Failed to reset password";
      if (error instanceof AxiosError)
        msg = error.response?.data?.message || msg;
      dispatch(setError(msg));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function register(
    username: string,
    email: string,
    password: string
  ): Promise<boolean> {
    dispatch(setLoading(true));
    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
      });
      return true;
    } catch (error) {
      let errorMessage = "Registration failed";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message ?? errorMessage;
      }
      dispatch(setError(errorMessage));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }

  return { login, logout, register, forgotPassword, resetPassword };
}
