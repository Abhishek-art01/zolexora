import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: any | null;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (token, user) => {
        localStorage.setItem("z_seller_token", token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem("z_seller_token");
        set({ token: null, user: null });
      },
    }),
    { name: "z_seller_auth" }
  )
);
