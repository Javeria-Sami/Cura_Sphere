import { create } from "zustand";

interface UserProfile {
  userId: number;
  username: string;
  roleName: string;
  employeeName: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  permissions: string[];
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile, permissions: string[]) => void;
  logout: () => void;
}

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Return null in restricted contexts
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Storage write suppressed
  }
};

const removeStorageItem = (key: string): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage removal suppressed
  }
};

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state safely (SSR and Node.js test environment safe)
  const savedToken = getStorageItem("token");
  const savedUser = getStorageItem("user");
  const savedPermissions = getStorageItem("permissions");

  return {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,
    permissions: savedPermissions ? JSON.parse(savedPermissions) : [],
    isAuthenticated: !!savedToken,
    login: (token, user, permissions) => {
      setStorageItem("token", token);
      setStorageItem("user", JSON.stringify(user));
      setStorageItem("permissions", JSON.stringify(permissions));
      set({
        token,
        user,
        permissions,
        isAuthenticated: true,
      });
    },
    logout: () => {
      removeStorageItem("token");
      removeStorageItem("user");
      removeStorageItem("permissions");
      set({
        token: null,
        user: null,
        permissions: [],
        isAuthenticated: false,
      });
    },
  };
});
