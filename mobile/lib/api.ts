import Constants from "expo-constants";

const API_PORT = 3000;
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  status: number; // 0 means the server could not be reached

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let cachedBaseUrl: string | null = null;

function getBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl;

  // 1. Manual override (needed with --tunnel, or for a deployed server later)
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    const url = fromEnv.replace(/\/+$/, "");
    cachedBaseUrl = url;
    return url;
  }

  // 2. Development: the laptop that runs Metro also runs the API
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.100.18:8081"
  if (hostUri) {
    const url = `http://${hostUri.split(":")[0]}:${API_PORT}`;
    cachedBaseUrl = url;
    return url;
  }

  throw new Error("API address unknown. Set EXPO_PUBLIC_API_URL in mobile/.env");
}

// --- Sign-in state, shared by every request ---
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// Called when the server rejects our token (expired or account deleted)
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Params = Record<string, string | number | undefined>;

async function request<T>(
  method: "GET" | "POST",
  path: string,
  options: { params?: Params; body?: unknown } = {}
): Promise<T> {
  const query = Object.entries(options.params ?? {})
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  const url = `${getBaseUrl()}${path}${query ? `?${query}` : ""}`;

  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    if (response.status === 401 && authToken) onUnauthorized?.();

    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data?.error === "string") message = data.error;
    } catch {
      // the server sent no JSON; keep the generic message
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string, params: Params = {}): Promise<T> {
  return request<T>("GET", path, { params });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, { body });
}