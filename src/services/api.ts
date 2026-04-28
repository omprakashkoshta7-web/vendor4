import { API_BASE_URL } from "../config/api";

const AUTH_TOKEN_KEY = "auth_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Get the stored backend JWT.
 * This is the short JWT returned by POST /api/auth/verify — NOT a Firebase token.
 */
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Store the backend JWT after a successful /api/auth/verify exchange.
 */
export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Clear the backend JWT on logout.
 */
export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Guard against multiple simultaneous 401 redirects
let _redirecting = false;

/**
 * Central API request function.
 * Always uses the stored backend JWT — never fetches a Firebase token here.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || "Request failed";

    if (response.status === 401 && !_redirecting) {
      _redirecting = true;
      clearAuthToken();
      localStorage.removeItem("vendor_session");
      // Redirect to login after a short delay to allow current render to finish
      setTimeout(() => {
        window.location.href = "/login";
        _redirecting = false;
      }, 100);
    }

    throw new ApiError(message, response.status);
  }

  if (payload == null) {
    throw new ApiError("Empty or invalid server response", response.status || 500);
  }

  return payload as T;
}
