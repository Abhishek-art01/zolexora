import axios from "axios";
const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.zolexora.com/api";
export const api = axios.create({ baseURL: BASE, timeout: 15000 });
api.interceptors.request.use((c) => {
  const t = typeof window !== "undefined" ? localStorage.getItem("z_admin_token") : null;
  if (t && c.headers) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use((r) => r, (e) => {
  if (e?.response?.status === 401 && typeof window !== "undefined") { localStorage.removeItem("z_admin_token"); window.location.href = "/auth"; }
  return Promise.reject(e);
});

export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }).then(r => r.data),
  me: () => api.get("/auth/me").then(r => r.data),
};
export const adminApi = {
  stats:         () => api.get("/admin/stats").then(r => r.data),
  analytics:     () => api.get("/admin/analytics").then(r => r.data),
  users:         () => api.get("/admin/users").then(r => r.data),
  setUserRole:   (uid: string, role: string) => api.put(`/admin/users/${uid}/role`, null, { params: { role } }).then(r => r.data),
  toggleUser:    (uid: string) => api.put(`/admin/users/${uid}/toggle`).then(r => r.data),
  products:      () => api.get("/admin/products").then(r => r.data),
  toggleProduct: (pid: string) => api.put(`/admin/products/${pid}/toggle`).then(r => r.data),
  deleteProduct: (pid: string) => api.delete(`/admin/products/${pid}`).then(r => r.data),
  reels:         () => api.get("/admin/reels").then(r => r.data),
  toggleReel:    (rid: string) => api.put(`/admin/reels/${rid}/toggle`).then(r => r.data),
  deleteReel:    (rid: string) => api.delete(`/admin/reels/${rid}`).then(r => r.data),
  orders:        () => api.get("/admin/orders").then(r => r.data),
};
