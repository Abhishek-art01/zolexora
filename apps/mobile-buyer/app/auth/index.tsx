import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { authApi } from "../../src/lib/api";
import { useAuthStore } from "../../src/store";
import Toast from "react-native-toast-message";

type Step = "login"|"register"|"otp";

export default function AuthScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"viewer" });
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) { Toast.show({ type:"error", text1:"Fill all fields" }); return; }
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      await login(res.token, res.user);
      router.back();
    } catch (e: any) { Toast.show({ type:"error", text1:e?.response?.data?.detail || "Login failed" }); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { Toast.show({ type:"error", text1:"Fill all fields" }); return; }
    setLoading(true);
    try {
      await authApi.register(form);
      setPendingEmail(form.email);
      setStep("otp");
      Toast.show({ type:"success", text1:"Code sent to your email" });
    } catch (e: any) { Toast.show({ type:"error", text1:e?.response?.data?.detail || "Failed" }); }
    finally { setLoading(false); }
  };

  const handleOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { Toast.show({ type:"error", text1:"Enter 6-digit code" }); return; }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(pendingEmail, code);
      await login(res.token, res.user);
      Toast.show({ type:"success", text1:"Welcome to Zolexora! 🎉" });
      router.back();
    } catch (e: any) { Toast.show({ type:"error", text1:e?.response?.data?.detail || "Invalid code" }); }
    finally { setLoading(false); }
  };

  const handleOtpInput = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) (global as any)[`otpRef${idx+1}`]?.focus?.();
  };

  const ic = ss.input;

  return (
    <KeyboardAvoidingView style={ss.container} behavior={Platform.OS==="ios"?"padding":"height"}>
      <ScrollView contentContainerStyle={ss.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInUp.duration(500)} style={ss.logoBox}>
          <Text style={ss.logo}>Zolexora</Text>
          <Text style={ss.logoSub}>{step==="otp" ? "Verify your email" : step==="register" ? "Create account" : "Welcome back"}</Text>
        </Animated.View>

        {step !== "otp" && (
          <Animated.View entering={FadeInDown.delay(100)} style={ss.tabs}>
            {(["login","register"] as const).map(t => (
              <TouchableOpacity key={t} style={[ss.tab, step===t && ss.tabActive]} onPress={() => setStep(t)}>
                <Text style={[ss.tabText, step===t && ss.tabTextActive]}>{t==="login"?"Sign In":"Register"}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(150)} style={ss.form}>
          {step === "login" && (
            <>
              <View style={ss.field}><Mail size={16} color="#AAA" style={ss.fieldIcon} /><TextInput style={ic} value={form.email} onChangeText={set("email")} placeholder="Email address" placeholderTextColor="#CCC" keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={ss.field}><Lock size={16} color="#AAA" style={ss.fieldIcon} /><TextInput style={ic} value={form.password} onChangeText={set("password")} placeholder="Password" placeholderTextColor="#CCC" secureTextEntry={!showPw} />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={ss.eyeBtn}>{showPw ? <EyeOff size={16} color="#AAA" /> : <Eye size={16} color="#AAA" />}</TouchableOpacity></View>
              <TouchableOpacity style={ss.btn} onPress={handleLogin} disabled={loading}>
                <Text style={ss.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "register" && (
            <>
              <View style={ss.field}><User size={16} color="#AAA" style={ss.fieldIcon} /><TextInput style={ic} value={form.name} onChangeText={set("name")} placeholder="Full name" placeholderTextColor="#CCC" /></View>
              <View style={ss.field}><Mail size={16} color="#AAA" style={ss.fieldIcon} /><TextInput style={ic} value={form.email} onChangeText={set("email")} placeholder="Email address" placeholderTextColor="#CCC" keyboardType="email-address" autoCapitalize="none" /></View>
              <View style={ss.field}><Lock size={16} color="#AAA" style={ss.fieldIcon} /><TextInput style={ic} value={form.password} onChangeText={set("password")} placeholder="Password" placeholderTextColor="#CCC" secureTextEntry={!showPw} />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={ss.eyeBtn}>{showPw ? <EyeOff size={16} color="#AAA" /> : <Eye size={16} color="#AAA" />}</TouchableOpacity></View>
              <View style={ss.roleRow}>
                {[{ v:"viewer", label:"🛍️ Buyer" },{ v:"seller", label:"🏪 Seller" }].map(r => (
                  <TouchableOpacity key={r.v} style={[ss.roleBtn, form.role===r.v && ss.roleBtnActive]} onPress={() => setForm(f=>({...f,role:r.v}))}>
                    <Text style={[ss.roleText, form.role===r.v && ss.roleTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={ss.btn} onPress={handleRegister} disabled={loading}>
                <Text style={ss.btnText}>{loading ? "Creating..." : "Create Account"}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "otp" && (
            <>
              <Text style={ss.otpHint}>Enter code sent to <Text style={ss.otpEmail}>{pendingEmail}</Text></Text>
              <View style={ss.otpRow}>
                {otp.map((d,i) => (
                  <TextInput key={i} ref={ref => { (global as any)[`otpRef${i}`] = ref; }}
                    style={ss.otpInput} value={d} onChangeText={v => handleOtpInput(v,i)}
                    keyboardType="number-pad" maxLength={1} textAlign="center"
                    onKeyPress={e => { if (e.nativeEvent.key==="Backspace"&&!d&&i>0) (global as any)[`otpRef${i-1}`]?.focus?.(); }} />
                ))}
              </View>
              <TouchableOpacity style={ss.btn} onPress={handleOtp} disabled={loading}>
                <Text style={ss.btnText}>{loading ? "Verifying..." : "Verify & Continue"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => { await authApi.resendOtp(pendingEmail); Toast.show({ type:"info", text1:"New code sent" }); }} style={ss.resendBtn}>
                <Text style={ss.resendText}>Resend code</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
        <View style={{ height:40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  container: { flex:1, backgroundColor:"#FAFAF8" },
  scroll: { flexGrow:1, paddingHorizontal:24, paddingTop:60 },
  logoBox: { alignItems:"center", marginBottom:32 },
  logo: { fontSize:32, fontWeight:"900", color:"#111" },
  logoSub: { fontSize:14, color:"#888", marginTop:4 },
  tabs: { flexDirection:"row", backgroundColor:"#F0F0F0", borderRadius:14, padding:3, marginBottom:24 },
  tab: { flex:1, paddingVertical:10, borderRadius:12, alignItems:"center" },
  tabActive: { backgroundColor:"#fff" },
  tabText: { fontSize:14, fontWeight:"700", color:"#888" },
  tabTextActive: { color:"#111" },
  form: { gap:14 },
  field: { flexDirection:"row", alignItems:"center", backgroundColor:"#fff", borderRadius:16, paddingHorizontal:14, height:52, borderWidth:1.5, borderColor:"#F0F0F0" },
  fieldIcon: { marginRight:10 },
  input: { flex:1, fontSize:15, color:"#111" },
  eyeBtn: { padding:4 },
  roleRow: { flexDirection:"row", gap:12 },
  roleBtn: { flex:1, paddingVertical:12, borderRadius:16, backgroundColor:"#fff", borderWidth:2, borderColor:"#F0F0F0", alignItems:"center" },
  roleBtnActive: { borderColor:"#FFB800", backgroundColor:"#FFFBEB" },
  roleText: { fontSize:13, fontWeight:"700", color:"#888" },
  roleTextActive: { color:"#111" },
  btn: { backgroundColor:"#FFB800", borderRadius:18, height:54, alignItems:"center", justifyContent:"center", marginTop:4 },
  btnText: { fontSize:16, fontWeight:"900", color:"#111" },
  otpHint: { fontSize:14, color:"#888", textAlign:"center" },
  otpEmail: { fontWeight:"800", color:"#111" },
  otpRow: { flexDirection:"row", justifyContent:"center", gap:10 },
  otpInput: { width:46, height:56, borderRadius:14, backgroundColor:"#fff", borderWidth:2, borderColor:"#F0F0F0", fontSize:22, fontWeight:"900", color:"#111" },
  resendBtn: { alignItems:"center", paddingVertical:8 },
  resendText: { fontSize:14, fontWeight:"700", color:"#FFB800" },
});
