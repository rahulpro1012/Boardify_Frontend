import { useDispatch } from "react-redux";
import { AxiosError } from "axios"; // Import AxiosError type
import api from "../../api/apiClient";
import { authActions } from "./authSlice";

// 1. Define the expected shape of your API response
interface LoginResponse {
  token: string;
  email: string;
}

export function useAuth() {
  const dispatch = useDispatch();

  async function login(email: string, password: string): Promise<boolean> {
    dispatch(authActions.setLoading(true));
    try {
      // 2. Add Generic Type <LoginResponse> to .post()
      const resp = await api.post<LoginResponse>(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );

      const { token, email: userEmail } = resp.data;

      dispatch(authActions.settoken(token));
      dispatch(authActions.setUser({ email: userEmail }));

      return true; // Return success status
    } catch (error) {
      // 3. Fix "Unexpected any" by narrowing the type
      let errorMessage = "Login failed";

      if (error instanceof AxiosError) {
        // Now TypeScript knows 'response' exists on this error object
        errorMessage = error.response?.data?.message ?? errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      dispatch(authActions.setError(errorMessage));
      return false; // Return failure status
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      // Always clear local state, even if the API call failed
      dispatch(authActions.logoutLocal());
    }
  }

  async function forgotPassword(email: string): Promise<boolean> {
    dispatch(authActions.setLoading(true));
    try {
      await api.post("/auth/forgot-password", { email });
      // We don't return "false" on error here usually, so the user always sees success
      return true;
    } catch (error) {
      // In a real app, you might log this silently
      console.error("Forgot password error:", error);
      return false;
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }

  async function resetPassword(
    token: string,
    newPassword: string
  ): Promise<boolean> {
    dispatch(authActions.setLoading(true));
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      return true;
    } catch (error) {
      let msg = "Failed to reset password";
      if (error instanceof AxiosError)
        msg = error.response?.data?.message || msg;
      dispatch(authActions.setError(msg));
      return false;
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }

  async function register(
    username: string,
    email: string,
    password: string
  ): Promise<boolean> {
    dispatch(authActions.setLoading(true));
    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
      });

      // Assuming registration doesn't auto-login, we just return true
      return true;
    } catch (error) {
      let errorMessage = "Registration failed";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message ?? errorMessage;
      }
      dispatch(authActions.setError(errorMessage));
      return false;
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }

  return { login, logout, register, forgotPassword, resetPassword };
}
