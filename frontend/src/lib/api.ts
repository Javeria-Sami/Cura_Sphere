import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "../stores/authStore";

const configuredApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) as string | undefined;
const resolvedBaseUrl = configuredApiUrl
  ? (configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl.replace(/\/$/, "")}/api`)
  : "/api";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response Interceptor to handle authentication errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
