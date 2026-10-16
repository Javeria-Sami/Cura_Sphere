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

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from localStorage safely
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  const savedPermissions = localStorage.getItem("permissions");

  return {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,
    permissions: savedPermissions ? JSON.parse(savedPermissions) : [],
    isAuthenticated: !!savedToken,
    login: (token, user, permissions) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("permissions", JSON.stringify(permissions));
      set({
        token,
        user,
        permissions,
        isAuthenticated: true,
      });
    },
    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      set({
        token: null,
        user: null,
        permissions: [],
        isAuthenticated: false,
      });
    },
  };
});
