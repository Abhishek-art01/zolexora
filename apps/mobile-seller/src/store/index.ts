import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthState { user:any|null; token:string|null; login:(t:string,u:any)=>Promise<void>; logout:()=>Promise<void>; }
export const useAuthStore = create<AuthState>((set) => ({
  user: null, token: null,
  login: async (token, user) => { await SecureStore.setItemAsync("z_seller_token", token); set({ token, user }); },
  logout: async () => { await SecureStore.deleteItemAsync("z_seller_token"); set({ token:null, user:null }); },
}));
