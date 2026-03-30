import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.zolexora.com/api";

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("z_seller_token");
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("z_seller_token");
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }).then((r) => r.data),
  register: (d: any) => api.post("/auth/register", d).then((r) => r.data),
  resendOtp: (email: string) => api.post("/auth/resend-otp", { email }).then((r) => r.data),
  verifyOtp: (email: string, otp: string) => api.post("/auth/verify-register", { email, otp }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const productsApi = {
  my: () => api.get("/products/my").then((r) => r.data),
  create: (d: any) => api.post("/products", d).then((r) => r.data),
  update: (id: string, d: any) => api.put(`/products/${id}`, d).then((r) => r.data),
  delete: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
  uploadImage: (id: string, file: File) => {
    const fd = new FormData(); fd.append("file", file);
    return api.post(`/products/${id}/upload-image`, fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
};

export const reelsApi = {
  my: () => api.get("/reels/my").then((r) => r.data),
  create: (d: any) => api.post("/reels", d).then((r) => r.data),
  update: (id: string, d: any) => api.put(`/reels/${id}`, d).then((r) => r.data),
  delete: (id: string) => api.delete(`/reels/${id}`).then((r) => r.data),
  uploadMedia: (id: string, file: File) => {
    const fd = new FormData(); fd.append("file", file);
    return api.post(`/reels/${id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
};

export const ordersApi = {
  seller: () => api.get("/orders/seller").then((r) => r.data),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, null, { params: { status } }).then((r) => r.data),
};

export const coinsApi = {
  balance: () => api.get("/coins/balance").then((r) => r.data),
};
