import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { store } from "../app/store";
// FIX: Import the actions directly, not the type
import { setToken, logout } from "../features/auth/authSlice";

interface RefreshResponse {
  token: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Concurrency handling variable
let refreshPromise: Promise<string | null> | null = null;

async function refreshtoken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const resp = await axios.post<RefreshResponse>(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { token } = resp.data;

      if (token) {
        // FIX: Dispatch the imported action directly
        store.dispatch(setToken(token));
        return token;
      }

      throw new Error("No access token found in refresh response");
    } catch (err) {
      console.error("Token refresh failed. Logging out.", err);
      // FIX: Dispatch the imported action directly
      store.dispatch(logout());
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    // Avoid infinite loops on login/register
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshtoken();
        if (newToken) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
