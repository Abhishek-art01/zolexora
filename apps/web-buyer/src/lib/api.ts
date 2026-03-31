import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.zolexora.com/api";

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("z_token");
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("z_token");
      window.dispatchEvent(new Event("z:logout"));
    }
    return Promise.reject(err);
  }
);

// ── Services ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (d: any) => api.post("/auth/register", d).then((r) => r.data),
  resendOtp: (email: string) => api.post("/auth/resend-otp", { email }).then((r) => r.data),
  verifyOtp: (email: string, otp: string) => api.post("/auth/verify-register", { email, otp }).then((r) => r.data),
  login: (email: string, password: string) => api.post("/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const productsApi = {
  list: (params?: any) => api.get("/products", { params }).then((r) => r.data),
  get: (id: string) => api.get(`/products/${id}`).then((r) => r.data),
};

export const cartApi = {
  get: () => api.get("/cart").then((r) => r.data),
  count: () => api.get("/cart/count").then((r) => r.data),
  add: (product_id: string, quantity = 1) => api.post("/cart/items", { product_id, quantity }).then((r) => r.data),
  update: (product_id: string, quantity: number) => api.put(`/cart/items/${product_id}`, null, { params: { quantity } }).then((r) => r.data),
  remove: (product_id: string) => api.delete(`/cart/items/${product_id}`).then((r) => r.data),
  checkout: (d: any) => api.post("/cart/checkout", d).then((r) => r.data),
};

export const ordersApi = {
  my: () => api.get("/orders/my").then((r) => r.data),
};

export const coinsApi = {
  balance:          () => api.get("/coins/balance").then((r) => r.data),
  history:          () => api.get("/coins/history").then((r) => r.data),
  myDiscounts:      () => api.get("/coins/discounts").then((r) => r.data),
  generateDiscount: (coins_to_spend: number, product_id?: string) =>
    api.post("/coins/generate-discount", { coins_to_spend, product_id }).then((r) => r.data),
};
