"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store";
import { authApi } from "@/lib/api";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type Step = "login" | "register" | "otp";

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      login(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await authApi.register(form);
      setPendingEmail(form.email);
      setStep("otp");
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(pendingEmail, code);
      login(res.token, res.user);
      toast.success("Account created! Welcome to Zolexora 🎉");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid code");
    } finally { setLoading(false); }
  };

  const handleOtpInput = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) (document.getElementById(`otp-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const handleOtpKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      (document.getElementById(`otp-${idx - 1}`) as HTMLInputElement)?.focus();
  };

  const inputCls = "w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold focus:bg-white transition-all placeholder:text-gray-400";

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-cream">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-modal p-8 border border-gray-100">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-display text-2xl font-bold text-ink">Zolexora</span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">
            {step === "login" ? "Sign in to your account" : step === "register" ? "Create your account" : "Enter verification code"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {step === "login" && (
            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="email" placeholder="Email address" required value={form.email} onChange={set("email")} className={inputCls} />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type={showPw ? "text" : "password"} placeholder="Password" required value={form.password} onChange={set("password")} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-ink">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-gold hover:bg-gold-dark text-ink font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={15} /></>}
              </button>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <button type="button" onClick={() => setStep("register")} className="text-gold font-semibold hover:underline">Create one</button>
              </p>
            </motion.form>
          )}

          {/* REGISTER */}
          {step === "register" && (
            <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="text" placeholder="Full name" required value={form.name} onChange={set("name")} className={inputCls} />
              </div>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="email" placeholder="Email address" required value={form.email} onChange={set("email")} className={inputCls} />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type={showPw ? "text" : "password"} placeholder="Password (min 6 chars)" required value={form.password} onChange={set("password")} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-ink">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">I want to</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: "viewer", label: "🛍️ Shop & Watch", sub: "Buy products & earn coins" },
                    { val: "seller", label: "🏪 Sell Products", sub: "List products & manage orders" }].map((r) => (
                    <button key={r.val} type="button" onClick={() => setForm((f) => ({ ...f, role: r.val }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${form.role === r.val ? "border-gold bg-gold/5" : "border-gray-100 hover:border-gray-200"}`}>
                      <p className="text-sm font-semibold text-ink">{r.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{r.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-gold hover:bg-gold-dark text-ink font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={15} /></>}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button type="button" onClick={() => setStep("login")} className="text-gold font-semibold hover:underline">Sign in</button>
              </p>
            </motion.form>
          )}

          {/* OTP */}
          {step === "otp" && (
            <motion.form key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={handleOtp} className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">Code sent to</p>
                <p className="font-bold text-ink">{pendingEmail}</p>
              </div>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpInput(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKey(e, i)}
                    className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-gold transition-colors bg-gray-50 focus:bg-white" />
                ))}
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-gold hover:bg-gold-dark text-ink font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Continue"}
              </button>
              <p className="text-center text-sm text-gray-500">
                Didn't receive it?{" "}
                <button type="button" onClick={async () => { await authApi.resendOtp(pendingEmail); toast.success("New code sent"); }} className="text-gold font-semibold hover:underline">Resend</button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
