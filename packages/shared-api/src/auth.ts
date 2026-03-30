import { getApiClient, setStoredToken, removeStoredToken } from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "./types";

export async function register(data: RegisterRequest): Promise<{ status: string; email: string; message: string }> {
  const res = await getApiClient().post("/auth/register", data);
  return res.data;
}

export async function verifyRegister(email: string, otp: string): Promise<AuthResponse> {
  const res = await getApiClient().post("/auth/verify-register", { email, otp });
  const auth: AuthResponse = res.data;
  setStoredToken(auth.token);
  return auth;
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  const res = await getApiClient().post("/auth/resend-otp", { email });
  return res.data;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await getApiClient().post("/auth/login", data);
  const auth: AuthResponse = res.data;
  setStoredToken(auth.token);
  return auth;
}

export async function getMe(): Promise<User> {
  const res = await getApiClient().get("/auth/me");
  return res.data;
}

export function logout(): void {
  removeStoredToken();
}
