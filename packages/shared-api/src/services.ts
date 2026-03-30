import { getApiClient } from "./client";
import type {
  Product, ProductCreateRequest, Reel, ReelCreateRequest,
  CartItem, Order, OrderStatus, CoinTransaction, CoinBalance,
  CheckoutRequest, CheckoutResponse, CheckoutStatus,
  DiscountCode, SubscriptionPlans, AdminStats, User,
} from "./types";

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = {
  list:   (category?: string) => getApiClient().get<Product[]>("/products", { params: category ? { category } : undefined }).then(r => r.data),
  get:    (id: string)        => getApiClient().get<Product>(`/products/${id}`).then(r => r.data),
  my:     ()                  => getApiClient().get<Product[]>("/products/my").then(r => r.data),
  create: (d: ProductCreateRequest) => getApiClient().post<Product>("/products", d).then(r => r.data),
  update: (id: string, d: Partial<ProductCreateRequest>) => getApiClient().put(`/products/${id}`, d).then(r => r.data),
  delete: (id: string) => getApiClient().delete(`/products/${id}`).then(r => r.data),
  uploadImage: (id: string, file: File) => {
    const fd = new FormData(); fd.append("file", file);
    return getApiClient().post<{ image_url: string }>(`/products/${id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
  },
};

// ─── Reels ────────────────────────────────────────────────────────────────────
export const reels = {
  list:   ()                    => getApiClient().get<Reel[]>("/reels").then(r => r.data),
  my:     ()                    => getApiClient().get<Reel[]>("/reels/my").then(r => r.data),
  create: (d: ReelCreateRequest) => getApiClient().post<Reel>("/reels", d).then(r => r.data),
  delete: (id: string)          => getApiClient().delete(`/reels/${id}`).then(r => r.data),
  view:   (id: string)          => getApiClient().post<{ coins_earned: number; message: string }>(`/reels/${id}/view`).then(r => r.data),
  uploadMedia: (id: string, file: File) => {
    const fd = new FormData(); fd.append("file", file);
    return getApiClient().post<{ video_url: string }>(`/reels/${id}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
  },
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cart = {
  get:    ()                               => getApiClient().get<CartItem[]>("/cart").then(r => r.data),
  count:  ()                               => getApiClient().get<{ count: number }>("/cart/count").then(r => r.data),
  add:    (product_id: string, quantity = 1) => getApiClient().post("/cart/items", { product_id, quantity }).then(r => r.data),
  update: (product_id: string, quantity: number) => getApiClient().put(`/cart/items/${product_id}`, null, { params: { quantity } }).then(r => r.data),
  remove: (product_id: string)             => getApiClient().delete(`/cart/items/${product_id}`).then(r => r.data),
  checkout: (d: CheckoutRequest)           => getApiClient().post<CheckoutResponse>("/cart/checkout", d).then(r => r.data),
  checkoutStatus: (session_id: string)     => getApiClient().get<CheckoutStatus>(`/cart/checkout/status/${session_id}`).then(r => r.data),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = {
  my:     ()                                => getApiClient().get<Order[]>("/orders/my").then(r => r.data),
  seller: ()                                => getApiClient().get<Order[]>("/orders/seller").then(r => r.data),
  updateStatus: (id: string, status: OrderStatus) => getApiClient().put(`/orders/${id}/status`, null, { params: { status } }).then(r => r.data),
};

// ─── Coins ────────────────────────────────────────────────────────────────────
export const coins = {
  balance: ()                  => getApiClient().get<CoinBalance>("/coins/balance").then(r => r.data),
  history: ()                  => getApiClient().get<CoinTransaction[]>("/coins/history").then(r => r.data),
  generateDiscount: (coins_to_spend: number, product_id?: string) =>
    getApiClient().post<DiscountCode>("/discounts/generate", { coins_to_spend, product_id }).then(r => r.data),
  myDiscounts: ()              => getApiClient().get<DiscountCode[]>("/discounts/my").then(r => r.data),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = {
  plans:    ()                                   => getApiClient().get<SubscriptionPlans>("/subscriptions/plans").then(r => r.data),
  checkout: (plan_type: string, origin_url: string) =>
    getApiClient().post<{ url: string; session_id: string }>("/subscriptions/checkout", { plan_type, origin_url }).then(r => r.data),
  status:   (session_id: string)                 => getApiClient().get(`/subscriptions/status/${session_id}`).then(r => r.data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const admin = {
  stats:          ()                             => getApiClient().get<AdminStats>("/admin/stats").then(r => r.data),
  users:          ()                             => getApiClient().get<User[]>("/admin/users").then(r => r.data),
  setUserRole:    (uid: string, role: string)    => getApiClient().put(`/admin/users/${uid}/role`, null, { params: { role } }).then(r => r.data),
  products:       ()                             => getApiClient().get<Product[]>("/admin/products").then(r => r.data),
  toggleProduct:  (pid: string)                  => getApiClient().put(`/admin/products/${pid}/toggle`).then(r => r.data),
  deleteProduct:  (pid: string)                  => getApiClient().delete(`/admin/products/${pid}`).then(r => r.data),
  reels:          ()                             => getApiClient().get<Reel[]>("/admin/reels").then(r => r.data),
  deleteReel:     (id: string)                   => getApiClient().delete(`/admin/reels/${id}`).then(r => r.data),
  orders:         ()                             => getApiClient().get<Order[]>("/admin/orders").then(r => r.data),
};
