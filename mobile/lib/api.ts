import Constants from "expo-constants";

const API_PORT = 3000;
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  status: number;

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

type Params = Record<string, string | number | undefined>;

export async function apiGet<T>(path: string, params: Params = {}): Promise<T> {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  const url = `${getBaseUrl()}${path}${query ? `?${query}` : ""}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new ApiError(`Request failed (${response.status})`, response.status);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}