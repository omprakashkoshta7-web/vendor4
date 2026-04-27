import { API_BASE_URL } from "../config/api";
import { auth, isFirebaseConfigured } from "../config/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

const AUTH_TOKEN_KEY = "auth_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function waitForFirebaseUser(timeoutMs = 1500): Promise<User | null> {
  if (!isFirebaseConfigured || auth.currentUser) {
    return auth.currentUser;
  }

  return await new Promise<User | null>((resolve) => {
    const timer = window.setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      window.clearTimeout(timer);
      unsubscribe();
      resolve(user);
    });
  });
}

async function getBearerToken() {
  const storedToken = getAuthToken();

  if (!isFirebaseConfigured) {
    return storedToken;
  }

  const firebaseUser = auth.currentUser || await waitForFirebaseUser();
  if (firebaseUser) {
    const freshToken = await firebaseUser.getIdToken();
    setAuthToken(freshToken);
    return freshToken;
  }

  return storedToken;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getBearerToken();
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
    const isAuthEndpoint = path.startsWith("/api/auth/");
    if (response.status === 401 && (isAuthEndpoint || !token)) {
      clearAuthToken();
      localStorage.removeItem("vendor_session");
    }
    throw new ApiError(message, response.status);
  }

  if (payload == null) {
    throw new ApiError("Empty or invalid server response", response.status || 500);
  }

  return payload as T;
}
