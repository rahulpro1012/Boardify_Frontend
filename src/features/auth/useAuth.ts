import { useDispatch } from "react-redux";
import { AxiosError } from "axios"; // Import AxiosError type
import api from "../../api/apiClient";
import { authActions } from "./authSlice";

// 1. Define the expected shape of your API response
interface LoginResponse {
  accessToken: string;
  email: string;
}

export function useAuth() {
  const dispatch = useDispatch();

  async function login(email: string, password: string): Promise<boolean> {
    dispatch(authActions.setLoading(true));
    try {
      // 2. Add Generic Type <LoginResponse> to .post()
      const resp = await api.post<LoginResponse>(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      const { accessToken, email: userEmail } = resp.data;

      dispatch(authActions.setAccessToken(accessToken));
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
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      // Always clear local state, even if the API call failed
      dispatch(authActions.logoutLocal());
    }
  }

  return { login, logout };
}
