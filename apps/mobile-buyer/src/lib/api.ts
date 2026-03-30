import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE = "https://api.zolexora.com/api";

export const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("z_token");
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

export const authApi = {
  register: (d: any) => api.post("/auth/register", d).then(r => r.data),
  resendOtp: (email: string) => api.post("/auth/resend-otp", { email }).then(r => r.data),
  verifyOtp: (email: string, otp: string) => api.post("/auth/verify-register", { email, otp }).then(r => r.data),
  login: (email: string, password: string) => api.post("/auth/login", { email, password }).then(r => r.data),
  me: () => api.get("/auth/me").then(r => r.data),
};

export const productsApi = {
  list: (params?: any) => api.get("/products", { params }).then(r => r.data),
  get: (id: string) => api.get(`/products/${id}`).then(r => r.data),
};

export const reelsApi = {
  list: (params?: any) => api.get("/reels", { params }).then(r => r.data),
  view: (id: string) => api.post(`/reels/${id}/view`).then(r => r.data),
};

export const cartApi = {
  get: () => api.get("/cart").then(r => r.data),
  count: () => api.get("/cart/count").then(r => r.data),
  add: (product_id: string, quantity = 1) => api.post("/cart/items", { product_id, quantity }).then(r => r.data),
  update: (product_id: string, quantity: number) => api.put(`/cart/items/${product_id}`, null, { params: { quantity } }).then(r => r.data),
  remove: (product_id: string) => api.delete(`/cart/items/${product_id}`).then(r => r.data),
  checkout: (d: any) => api.post("/cart/checkout", d).then(r => r.data),
};

export const ordersApi = {
  my: () => api.get("/orders/my").then(r => r.data),
};

export const coinsApi = {
  balance: () => api.get("/coins/balance").then(r => r.data),
  history: () => api.get("/coins/history").then(r => r.data),
};
