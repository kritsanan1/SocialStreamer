import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

let authState: AuthState = {
  user: null,
  loading: true,
};

const listeners: Array<(state: AuthState) => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => listener(authState));
}

function updateAuthState(updates: Partial<AuthState>) {
  authState = { ...authState, ...updates };
  notifyListeners();
}

// Initialize auth state from localStorage
function initializeAuth() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      updateAuthState({ user, loading: false });
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      updateAuthState({ user: null, loading: false });
    }
  } else {
    updateAuthState({ user: null, loading: false });
  }
}

// Initialize on import
initializeAuth();

export function useAuth() {
  const [state, setState] = useState<AuthState>(authState);
  const queryClient = useQueryClient();

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  // Query to get current user info
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!authState.user && !!localStorage.getItem("token"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    onSuccess: (userData) => {
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        updateAuthState({ user: userData });
      }
    },
    onError: () => {
      // Token is invalid, clear auth state
      logout();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      updateAuthState({ user: data.user, loading: false });
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      updateAuthState({ user: data.user, loading: false });
      queryClient.invalidateQueries();
    },
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateAuthState({ user: null, loading: false });
    queryClient.clear();
    queryClient.invalidateQueries();
  };

  const getToken = (): string | null => {
    return localStorage.getItem("token");
  };

  const isAuthenticated = (): boolean => {
    return !!state.user && !!getToken();
  };

  const hasRole = (role: string): boolean => {
    return state.user?.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole("admin");
  };

  const isEditor = (): boolean => {
    return hasRole("editor") || isAdmin();
  };

  return {
    user: state.user,
    loading: state.loading || userLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    getToken,
    isAuthenticated,
    hasRole,
    isAdmin,
    isEditor,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}

// Export auth utilities for use outside of React components
export const auth = {
  getToken: () => localStorage.getItem("token"),
  getUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
  isAuthenticated: () => {
    return !!(localStorage.getItem("token") && localStorage.getItem("user"));
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateAuthState({ user: null, loading: false });
  },
};

export default useAuth;
