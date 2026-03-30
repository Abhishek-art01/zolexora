"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store";
import { authApi } from "@/lib/api";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

type Step = "login" | "register" | "otp";

export default function SellerAuthPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      if (res.user.role !== "seller" && res.user.role !== "admin") { toast.error("This portal is for sellers only."); return; }
      login(res.token, res.user);
      router.push("/dashboard");
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Login failed"); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await authApi.register({ ...form, role: "seller" });
      setPendingEmail(form.email); setStep("otp");
      toast.success("Verification code sent");
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed"); }
    finally { setLoading(false); }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await authApi.verifyOtp(pendingEmail, otp.join(""));
      login(res.token, res.user); router.push("/dashboard");
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Invalid code"); }
    finally { setLoading(false); }
  };

  const handleOtpInput = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) (document.getElementById(`otp-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const ic = "w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gold focus:bg-white transition-all";

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8">
        <div className="text-center mb-8">
          <span className="font-display text-2xl font-bold text-ink">Zolexora</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mt-1">Seller Portal</p>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setStep(t); }} disabled={step === "otp"}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${step === t ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}>
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "login" && (
            <motion.form key="login" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              onSubmit={handleLogin} className="space-y-4">
              <div className="relative"><Mail size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="email" required value={form.email} onChange={set("email")} placeholder="Email" className={ic} /></div>
              <div className="relative"><Lock size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type={showPw ? "text" : "password"} required value={form.password} onChange={set("password")} placeholder="Password" className={`${ic} pr-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-gray-400">{showPw ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div>
              <button type="submit" disabled={loading} className="w-full h-11 bg-gold hover:bg-gold-dark text-ink font-bold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={15}/></>}
              </button>
            </motion.form>
          )}

          {step === "register" && (
            <motion.form key="register" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              onSubmit={handleRegister} className="space-y-4">
              <div className="relative"><User size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="text" required value={form.name} onChange={set("name")} placeholder="Your name" className={ic} /></div>
              <div className="relative"><Mail size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="email" required value={form.email} onChange={set("email")} placeholder="Email" className={ic} /></div>
              <div className="relative"><Lock size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type={showPw ? "text" : "password"} required value={form.password} onChange={set("password")} placeholder="Password" className={`${ic} pr-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-gray-400">{showPw ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div>
              <button type="submit" disabled={loading} className="w-full h-11 bg-gold hover:bg-gold-dark text-ink font-bold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Seller Account"}
              </button>
            </motion.form>
          )}

          {step === "otp" && (
            <motion.form key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleOtp} className="space-y-5">
              <p className="text-center text-sm text-ink-muted">Enter the 6-digit code sent to <span className="font-bold text-ink">{pendingEmail}</span></p>
              <div className="flex justify-center gap-2">
                {otp.map((d, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handleOtpInput(e.target.value, i)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) (document.getElementById(`otp-${i-1}`) as any)?.focus(); }}
                    className="w-11 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-gold bg-gray-50" />
                ))}
              </div>
              <button type="submit" disabled={loading} className="w-full h-11 bg-gold text-ink font-bold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Enter Dashboard"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
