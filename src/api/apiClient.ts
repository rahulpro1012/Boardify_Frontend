import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from "axios";
import { store } from "../app/store";
import { authActions } from "../features/auth/authSlice";

// 1. Better Type Definitions
interface RefreshResponse {
  accessToken: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 2. Concurrency handling variables
let refreshPromise: Promise<string | null> | null = null;

// 3. Enhanced Refresh Logic
async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already in progress, return the existing promise
  if (refreshPromise) {
    return refreshPromise;
  }

  // Create a new promise for the refresh process
  refreshPromise = (async () => {
    try {
      const resp = await axios.post<RefreshResponse>(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = resp.data;

      if (accessToken) {
        store.dispatch(authActions.setAccessToken(accessToken));
        return accessToken;
      }

      // If response was ok but no token, force logout
      throw new Error("No access token found in refresh response");
    } catch (err) {
      console.error("Token refresh failed. Logging out.", err);
      store.dispatch(authActions.logoutLocal());
      return null;
    } finally {
      // Reset the promise so future 401s can trigger a new refresh
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// 4. Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    // Check if headers exist before assigning
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 5. Response Interceptor
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    // Check 401 and ensure we haven't already retried this specific request
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          // Update the header and retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, reject with the original error or refresh error
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
