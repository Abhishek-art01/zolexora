import { create } from "zustand";
import { persist } from "zustand/middleware";
interface AuthState { user: any|null; token: string|null; login:(t:string,u:any)=>void; logout:()=>void; }
export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: null, token: null,
    login: (token, user) => { localStorage.setItem("z_admin_token", token); set({ token, user }); },
    logout: () => { localStorage.removeItem("z_admin_token"); set({ token: null, user: null }); },
  }),
  { name: "z_admin_auth" }
));
