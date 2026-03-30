import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE = "https://api.zolexora.com/api";
export const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("z_seller_token");
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

export const authApi = {
  login: (e: string, p: string) => api.post("/auth/login", { email:e, password:p }).then(r=>r.data),
  register: (d: any) => api.post("/auth/register", d).then(r=>r.data),
  verifyOtp: (email: string, otp: string) => api.post("/auth/verify-register", { email, otp }).then(r=>r.data),
  resendOtp: (email: string) => api.post("/auth/resend-otp", { email }).then(r=>r.data),
  me: () => api.get("/auth/me").then(r=>r.data),
};

export const productsApi = {
  my: () => api.get("/products/my").then(r=>r.data),
  create: (d: any) => api.post("/products", d).then(r=>r.data),
  update: (id: string, d: any) => api.put(`/products/${id}`, d).then(r=>r.data),
  delete: (id: string) => api.delete(`/products/${id}`).then(r=>r.data),
  uploadImage: async (id: string, uri: string) => {
    const fd = new FormData();
    fd.append("file", { uri, name:"image.jpg", type:"image/jpeg" } as any);
    return api.post(`/products/${id}/upload-image`, fd, { headers:{ "Content-Type":"multipart/form-data" }}).then(r=>r.data);
  },
};

export const reelsApi = {
  my: () => api.get("/reels/my").then(r=>r.data),
  create: (d: any) => api.post("/reels", d).then(r=>r.data),
  delete: (id: string) => api.delete(`/reels/${id}`).then(r=>r.data),
  uploadMedia: async (id: string, uri: string, type: string) => {
    const fd = new FormData();
    fd.append("file", { uri, name: type.startsWith("video")?"video.mp4":"image.jpg", type } as any);
    return api.post(`/reels/${id}/upload`, fd, { headers:{ "Content-Type":"multipart/form-data" }}).then(r=>r.data);
  },
};

export const ordersApi = {
  seller: () => api.get("/orders/seller").then(r=>r.data),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, null, { params:{ status }}).then(r=>r.data),
};

export const coinsApi = {
  balance: () => api.get("/coins/balance").then(r=>r.data),
};
