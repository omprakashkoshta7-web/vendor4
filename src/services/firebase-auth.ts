import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
} from "firebase/auth";
import { API_ENDPOINTS } from "../config/api";
import { auth, isFirebaseConfigured } from "../config/firebase";
import { clearAuthToken, setAuthToken } from "./api";

type VerifyResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      _id: string;
      firebaseUid?: string;
      email: string;
      name?: string;
      role: string;
    };
    token: string;
  };
};

async function verifyVendorToken(idToken: string) {
  const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}${API_ENDPOINTS.auth.verify}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken, role: "vendor" }),
  });

  const payload = (await response.json().catch(() => null)) as VerifyResponse | null;

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.message || "Vendor login verification failed");
  }

  return payload.data;
}

export async function loginWithFirebase(email: string, password: string) {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase login is not configured for this vendor app");
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    const data = await verifyVendorToken(idToken);

    if (!data.token) {
      await signOut(auth);
      clearAuthToken();
      localStorage.removeItem("vendor_session");
      throw new Error("Vendor session token was not returned by the server");
    }

    if (data.user.role !== "vendor") {
      await signOut(auth);
      clearAuthToken();
      localStorage.removeItem("vendor_session");
      throw new Error("This Firebase account is not approved for vendor access");
    }

    setAuthToken(data.token);
    return data;
  } catch (error) {
    const authError = error as AuthError & { message?: string };

    if (authError.code === "auth/invalid-credential") {
      throw new Error("Firebase rejected these credentials. Check the vendor account in the configured Firebase project.");
    }

    throw new Error(authError.message || "Vendor login failed");
  }
}

export async function logoutFirebase() {
  try {
    await signOut(auth);
  } finally {
    clearAuthToken();
    localStorage.removeItem("vendor_session");
  }
}

export function syncVendorAuthSession(onUnauthenticated: () => void) {
  let nullAuthGraceTimer: number | null = null;

  const cleanupTimer = () => {
    if (nullAuthGraceTimer !== null) {
      window.clearTimeout(nullAuthGraceTimer);
      nullAuthGraceTimer = null;
    }
  };

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    cleanupTimer();

    if (!firebaseUser) {
      // Firebase can briefly emit `null` during hydration right after login.
      // Give it a short grace window before forcing a logout redirect.
      nullAuthGraceTimer = window.setTimeout(() => {
        if (!auth.currentUser) {
          clearAuthToken();
          localStorage.removeItem("vendor_session");
          onUnauthenticated();
        }
      }, 1200);
      return;
    }

    try {
      const idToken = await firebaseUser.getIdToken();
      const data = await verifyVendorToken(idToken);

      if (!data.token || data.user.role !== "vendor") {
        clearAuthToken();
        localStorage.removeItem("vendor_session");
        onUnauthenticated();
        return;
      }

      setAuthToken(data.token);
    } catch {
      clearAuthToken();
      localStorage.removeItem("vendor_session");
      onUnauthenticated();
    }
  });

  return () => {
    cleanupTimer();
    unsubscribe();
  };
}
