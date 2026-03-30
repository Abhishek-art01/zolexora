// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = "viewer" | "seller" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  coin_balance: number;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  auth_provider: string;
  picture: string | null;
  created_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: "viewer" | "seller";
  device_id?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Reel ─────────────────────────────────────────────────────────────────────
export type ReelContentType = "organic" | "sponsored";

export interface Reel {
  id: string;
  creator_id: string;
  creator_name: string;
  title: string;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
  media_type: "video" | "image";
  content_type: ReelContentType;
  linked_product_id: string | null;
  sponsor_data: SponsorData | null;
  is_active: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
}

export interface SponsorData {
  cta_label: string;
  cta_url: string;
  brand_name: string;
  product_id?: string;
}

export interface ReelCreateRequest {
  title: string;
  description?: string;
  linked_product_id?: string;
  content_type?: ReelContentType;
  sponsor_data?: SponsorData;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export type ProductCategory =
  | "Electronics"
  | "Fashion"
  | "Home & Living"
  | "Beauty"
  | "Sports"
  | "Food"
  | "Other";

export interface Product {
  id: string;
  seller_id: string;
  seller_name: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  category: ProductCategory;
  images: string[];
  stock: number;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
}

export interface ProductCreateRequest {
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  category?: ProductCategory;
  images?: string[];
  stock?: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderItem {
  product_id: string;
  product_title: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface Order {
  id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  items: OrderItem[];
  subtotal: number;
  coins_used: number;
  coins_discount: number;
  total_paid: number;
  payment_method: string;
  payment_status: PaymentStatus;
  session_id: string | null;
  status: OrderStatus;
  created_at: string;
}

// ─── Coins ────────────────────────────────────────────────────────────────────
export type CoinTxType = "earned" | "spent" | "bonus";

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CoinTxType;
  description: string;
  ref_id: string | null;
  created_at: string;
}

export interface CoinBalance {
  coin_balance: number;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  name: string;
  price: number;
  coins_bonus: number;
  description: string;
}

export type SubscriptionPlans = Record<string, SubscriptionPlan>;

// ─── Admin Stats ──────────────────────────────────────────────────────────────
export interface AdminStats {
  total_users: number;
  viewers: number;
  sellers: number;
  total_reels: number;
  sponsored_reels: number;
  total_products: number;
  active_products: number;
  total_orders: number;
  paid_orders: number;
  total_reel_views: number;
  total_coins_earned: number;
  total_coins_spent: number;
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
export interface CheckoutRequest {
  origin_url: string;
  coins_to_use?: number;
}

export interface CheckoutResponse {
  type: "stripe" | "coins";
  url?: string;
  session_id?: string;
  order_id: string;
  message?: string;
}

export interface CheckoutStatus {
  status: string;
  payment_status: string;
  order_id: string | null;
}

// ─── Discount ─────────────────────────────────────────────────────────────────
export interface DiscountCode {
  id: string;
  user_id: string;
  code: string;
  discount_percent: number;
  coins_spent: number;
  is_used: boolean;
  product_id: string | null;
  created_at: string;
}

// ─── API Errors ───────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
}
