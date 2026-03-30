import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, cartApi } from "@/lib/api";

// ── Auth Store ────────────────────────────────────────────────────────────────
interface AuthState {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      login: (token, user) => {
        localStorage.setItem("z_token", token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem("z_token");
        set({ token: null, user: null });
      },
      fetchMe: async () => {
        const token = localStorage.getItem("z_token");
        if (!token) return;
        set({ loading: true });
        try {
          const user = await authApi.me();
          set({ user, token });
        } catch {
          localStorage.removeItem("z_token");
          set({ user: null, token: null });
        } finally {
          set({ loading: false });
        }
      },
    }),
    { name: "z_auth", partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);

// ── Cart Store ────────────────────────────────────────────────────────────────
interface CartState {
  items: any[];
  count: number;
  loading: boolean;
  fetch: () => Promise<void>;
  addItem: (product_id: string, qty?: number) => Promise<void>;
  removeItem: (product_id: string) => Promise<void>;
  updateQty: (product_id: string, qty: number) => Promise<void>;
  clear: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  count: 0,
  loading: false,
  fetch: async () => {
    const token = localStorage.getItem("z_token");
    if (!token) return;
    set({ loading: true });
    try {
      const items = await cartApi.get();
      set({ items, count: items.length });
    } catch {
      set({ items: [], count: 0 });
    } finally {
      set({ loading: false });
    }
  },
  addItem: async (product_id, qty = 1) => {
    await cartApi.add(product_id, qty);
    await get().fetch();
  },
  removeItem: async (product_id) => {
    await cartApi.remove(product_id);
    await get().fetch();
  },
  updateQty: async (product_id, qty) => {
    await cartApi.update(product_id, qty);
    await get().fetch();
  },
  clear: () => set({ items: [], count: 0 }),
}));
