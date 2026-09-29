import { create } from "zustand";

import type { AppError } from "@/lib/errors";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: AppError;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error?: AppError) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ isAuthenticated: false, isLoading: false, error: undefined }),
}));
