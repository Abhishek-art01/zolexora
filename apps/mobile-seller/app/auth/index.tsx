import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react-native";
import { authApi } from "../../src/lib/api";
import { useAuthStore } from "../../src/store";
import Toast from "react-native-toast-message";

type Step = "login"|"register"|"otp";

export default function SellerAuthScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      if (res.user.role !== "seller" && res.user.role !== "admin") { Toast.show({ type:"error", text1:"Seller account required" }); return; }
      await login(res.token, res.user);
      router.replace("/(tabs)");
    } catch (e: any) { Toast.show({ type:"error", text1:e?.response?.data?.detail||"Login failed" }); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await authApi.register({ ...form, role:"seller" });
      setPendingEmail(form.email); setStep("otp");
      Toast.show({ type:"success", text1:"Code sent to email" });
    } catch (e: any) { Toast.show({ type:"error", text1:e?.response?.data?.detail||"Failed" }); }
    finally { setLoading(false); }
  };

  const handleOtp = async () => {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(pendingEmail, otp.join(""));
      await login(res.token, res.user);
      router.replace("/(tabs)");
    } catch (e: any) { Toast.show({ type:"error", text1:e?.response?.data?.detail||"Invalid code" }); }
    finally { setLoading(false); }
  };

  const handleOtpInput = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) (global as any)[`sOtp${idx+1}`]?.focus?.();
  };

  const ic = ss.input;

  return (
    <KeyboardAvoidingView style={ss.container} behavior={Platform.OS==="ios"?"padding":"height"}>
      <ScrollView contentContainerStyle={ss.scroll} keyboardShouldPersistTaps="handled">
        <View style={ss.logoBox}>
          <Text style={ss.logo}>Zolexora</Text>
          <Text style={ss.logoSub}>Seller Portal</Text>
        </View>

        {step !== "otp" && (
          <View style={ss.tabs}>
            {(["login","register"] as const).map(t => (
              <TouchableOpacity key={t} style={[ss.tab, step===t&&ss.tabActive]} onPress={() => setStep(t)}>
                <Text style={[ss.tabText, step===t&&ss.tabTextActive]}>{t==="login"?"Sign In":"Register"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={ss.form}>
          {step === "login" && (<>
            <View style={ss.field}><Mail size={15} color="rgba(255,255,255,0.2)" style={ss.fi} /><TextInput style={ic} value={form.email} onChangeText={set("email")} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="email-address" autoCapitalize="none" /></View>
            <View style={ss.field}><Lock size={15} color="rgba(255,255,255,0.2)" style={ss.fi} /><TextInput style={ic} value={form.password} onChangeText={set("password")} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>{showPw?<EyeOff size={15} color="rgba(255,255,255,0.2)"/>:<Eye size={15} color="rgba(255,255,255,0.2)"/>}</TouchableOpacity></View>
            <TouchableOpacity style={ss.btn} onPress={handleLogin} disabled={loading}><Text style={ss.btnText}>{loading?"Signing in...":"Sign In"}</Text></TouchableOpacity>
          </>)}

          {step === "register" && (<>
            <View style={ss.field}><User size={15} color="rgba(255,255,255,0.2)" style={ss.fi} /><TextInput style={ic} value={form.name} onChangeText={set("name")} placeholder="Your name" placeholderTextColor="rgba(255,255,255,0.2)" /></View>
            <View style={ss.field}><Mail size={15} color="rgba(255,255,255,0.2)" style={ss.fi} /><TextInput style={ic} value={form.email} onChangeText={set("email")} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="email-address" autoCapitalize="none" /></View>
            <View style={ss.field}><Lock size={15} color="rgba(255,255,255,0.2)" style={ss.fi} /><TextInput style={ic} value={form.password} onChangeText={set("password")} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>{showPw?<EyeOff size={15} color="rgba(255,255,255,0.2)"/>:<Eye size={15} color="rgba(255,255,255,0.2)"/>}</TouchableOpacity></View>
            <TouchableOpacity style={ss.btn} onPress={handleRegister} disabled={loading}><Text style={ss.btnText}>{loading?"Creating...":"Create Seller Account"}</Text></TouchableOpacity>
          </>)}

          {step === "otp" && (<>
            <Text style={ss.otpHint}>Enter code sent to <Text style={{ color:"#FFB800" }}>{pendingEmail}</Text></Text>
            <View style={ss.otpRow}>
              {otp.map((d,i) => (
                <TextInput key={i} ref={r => { (global as any)[`sOtp${i}`] = r; }}
                  style={ss.otpInput} value={d} onChangeText={v => handleOtpInput(v,i)}
                  keyboardType="number-pad" maxLength={1} textAlign="center"
                  onKeyPress={e => { if (e.nativeEvent.key==="Backspace"&&!d&&i>0) (global as any)[`sOtp${i-1}`]?.focus?.(); }} />
              ))}
            </View>
            <TouchableOpacity style={ss.btn} onPress={handleOtp} disabled={loading}><Text style={ss.btnText}>{loading?"Verifying...":"Verify & Enter"}</Text></TouchableOpacity>
          </>)}
        </View>
        <View style={{ height:60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ss = StyleSheet.create({
  container: { flex:1, backgroundColor:"#111" },
  scroll: { flexGrow:1, paddingHorizontal:24, paddingTop:80 },
  logoBox: { alignItems:"center", marginBottom:36 },
  logo: { fontSize:32, fontWeight:"900", color:"#fff" },
  logoSub: { fontSize:13, color:"rgba(255,255,255,0.3)", fontWeight:"700", letterSpacing:3, textTransform:"uppercase", marginTop:4 },
  tabs: { flexDirection:"row", backgroundColor:"rgba(255,255,255,0.06)", borderRadius:14, padding:3, marginBottom:24 },
  tab: { flex:1, paddingVertical:10, borderRadius:12, alignItems:"center" },
  tabActive: { backgroundColor:"rgba(255,255,255,0.1)" },
  tabText: { fontSize:14, fontWeight:"700", color:"rgba(255,255,255,0.3)" },
  tabTextActive: { color:"#fff" },
  form: { gap:14 },
  field: { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.06)", borderRadius:16, paddingHorizontal:14, height:52, borderWidth:1, borderColor:"rgba(255,255,255,0.08)" },
  fi: { marginRight:10 },
  input: { flex:1, fontSize:15, color:"#fff" },
  btn: { backgroundColor:"#FFB800", borderRadius:18, height:54, alignItems:"center", justifyContent:"center", marginTop:6 },
  btnText: { fontSize:16, fontWeight:"900", color:"#111" },
  otpHint: { fontSize:14, color:"rgba(255,255,255,0.4)", textAlign:"center" },
  otpRow: { flexDirection:"row", justifyContent:"center", gap:10 },
  otpInput: { width:46, height:56, borderRadius:14, backgroundColor:"rgba(255,255,255,0.06)", borderWidth:2, borderColor:"rgba(255,255,255,0.1)", fontSize:22, fontWeight:"900", color:"#fff" },
});
