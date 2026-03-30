import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:8000/api";

let _client: AxiosInstance | null = null;

/** Returns a singleton Axios instance, lazily created. */
export function getApiClient(baseURL?: string): AxiosInstance {
  if (_client) return _client;

  _client = axios.create({
    baseURL: baseURL ?? DEFAULT_API_URL,
    timeout: 15_000,
    headers: { "Content-Type": "application/json" },
  });

  // Attach JWT on every request
  _client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401 globally
  _client.interceptors.response.use(
    (r) => r,
    (error) => {
      if (error?.response?.status === 401) {
        removeStoredToken();
        // Emit a custom event so any listener (auth context) can react
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("zolexora:unauthorized"));
        }
      }
      return Promise.reject(error);
    }
  );

  return _client;
}

// ── Token Storage ─────────────────────────────────────────────────────────────
const TOKEN_KEY = "zolexora_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function removeStoredToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
