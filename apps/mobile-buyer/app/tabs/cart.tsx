import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Coins } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { cartApi, coinsApi } from "../../src/lib/api";
import { useAuthStore, useCartStore } from "../../src/store";
import Toast from "react-native-toast-message";

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setCount } = useCartStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [cartData, coinData] = await Promise.all([cartApi.get(), coinsApi.balance()]);
      setItems(cartData);
      setCount(cartData.length);
      setCoinBalance(coinData.coin_balance);
    } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [user]);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const maxCoins = Math.min(coinBalance, Math.floor((subtotal * 0.5) / 0.01));
  const coinDiscount = parseFloat((coinsToUse * 0.01).toFixed(2));
  const total = Math.max(0, subtotal - coinDiscount) + (subtotal >= 499 ? 0 : 49);

  const handleQty = async (product_id: string, qty: number) => {
    try {
      await cartApi.update(product_id, qty);
      if (qty <= 0) {
        setItems(prev => prev.filter(i => i.product_id !== product_id));
        setCount(items.length - 1);
      } else {
        setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity: qty } : i));
      }
    } catch {}
  };

  const handleCheckout = async () => {
    if (!user) { router.push("/auth"); return; }
    setCheckingOut(true);
    try {
      const res = await cartApi.checkout({ coins_to_use: coinsToUse, origin_url: "https://zolexora.com" });
      if (res.type === "razorpay") {
        Toast.show({ type:"info", text1:"Payment", text2:"Razorpay gateway coming soon", visibilityTime:3000 });
      } else if (res.type === "coins" || res.type === "razorpay_pending_setup") {
        Toast.show({ type:"success", text1:"Order placed!", text2:`Order #${res.order_id?.slice(0,8).toUpperCase()}` });
        setItems([]);
        setCount(0);
        router.push("/(tabs)/orders");
      }
    } catch (e: any) {
      Toast.show({ type:"error", text1:e?.response?.data?.detail || "Checkout failed" });
    } finally { setCheckingOut(false); }
  };

  if (!user) return (
    <View style={ss.centered}>
      <ShoppingBag size={48} color="#E0E0E0" />
      <Text style={ss.emptyTitle}>Sign in to view cart</Text>
      <TouchableOpacity style={ss.signInBtn} onPress={() => router.push("/auth")}>
        <Text style={ss.signInText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={ss.centered}><ActivityIndicator color="#FFB800" size="large" /></View>;

  if (items.length === 0) return (
    <View style={ss.centered}>
      <ShoppingBag size={48} color="#E0E0E0" />
      <Text style={ss.emptyTitle}>Your cart is empty</Text>
      <TouchableOpacity style={ss.shopBtn} onPress={() => router.push("/(tabs)/shop")}>
        <Text style={ss.shopBtnText}>Start Shopping</Text>
        <ArrowRight size={15} color="#111" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={ss.container}>
      <View style={ss.header}><Text style={ss.title}>Cart</Text><Text style={ss.count}>{items.length} items</Text></View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={ss.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60)} style={ss.cartItem}>
            <TouchableOpacity onPress={() => router.push(`/product/${item.product_id}`)}>
              {item.product?.images?.[0]
                ? <Image source={{ uri:item.product.images[0] }} style={ss.itemImg} />
                : <View style={[ss.itemImg, { backgroundColor:"#F5F5F5", alignItems:"center", justifyContent:"center" }]}><Text>📦</Text></View>}
            </TouchableOpacity>
            <View style={ss.itemInfo}>
              <Text style={ss.itemTitle} numberOfLines={2}>{item.product?.title}</Text>
              <Text style={ss.itemPrice}>₹{item.product?.price?.toLocaleString("en-IN")}</Text>
              <View style={ss.qtyRow}>
                <TouchableOpacity style={ss.qtyBtn} onPress={() => handleQty(item.product_id, item.quantity - 1)}>
                  <Minus size={13} color="#111" />
                </TouchableOpacity>
                <Text style={ss.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={ss.qtyBtn} onPress={() => handleQty(item.product_id, item.quantity + 1)}>
                  <Plus size={13} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity style={ss.removeBtn} onPress={() => handleQty(item.product_id, 0)}>
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
        ListFooterComponent={
          <View style={ss.summary}>
            {coinBalance > 0 && (
              <View style={ss.coinBox}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginBottom:8 }}>
                  <Coins size={16} color="#111" />
                  <Text style={ss.coinTitle}>Use Coins</Text>
                  <Text style={ss.coinBal}>{coinBalance} available</Text>
                </View>
                <View style={ss.coinOptions}>
                  {[0, Math.min(50, maxCoins), Math.min(100, maxCoins), Math.min(200, maxCoins)].filter((v,i,a)=>a.indexOf(v)===i&&v<=maxCoins).map(v => (
                    <TouchableOpacity key={v} style={[ss.coinOpt, coinsToUse===v && ss.coinOptActive]} onPress={() => setCoinsToUse(v)}>
                      <Text style={[ss.coinOptText, coinsToUse===v && ss.coinOptTextActive]}>{v===0?"No coins":`${v} coins`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {coinsToUse > 0 && <Text style={ss.coinSaving}>Saving ₹{coinDiscount.toFixed(0)}</Text>}
              </View>
            )}

            <View style={ss.totalBox}>
              <View style={ss.totalRow}><Text style={ss.totalLabel}>Subtotal</Text><Text style={ss.totalVal}>₹{subtotal.toLocaleString("en-IN")}</Text></View>
              {coinDiscount > 0 && <View style={ss.totalRow}><Text style={[ss.totalLabel,{color:"#22C55E"}]}>Coin discount</Text><Text style={{color:"#22C55E",fontWeight:"700"}}>-₹{coinDiscount.toFixed(0)}</Text></View>}
              <View style={ss.totalRow}><Text style={ss.totalLabel}>Delivery</Text><Text style={[ss.totalVal,{color:"#22C55E"}]}>{subtotal>=499?"FREE":"₹49"}</Text></View>
              <View style={[ss.totalRow,{borderTopWidth:1,borderTopColor:"#F0F0F0",paddingTop:10,marginTop:4}]}>
                <Text style={ss.grandLabel}>Total</Text>
                <Text style={ss.grandVal}>₹{total.toLocaleString("en-IN")}</Text>
              </View>
            </View>

            <TouchableOpacity style={ss.checkoutBtn} onPress={handleCheckout} disabled={checkingOut}>
              <Text style={ss.checkoutText}>{checkingOut ? "Processing..." : "Proceed to Checkout"}</Text>
              {!checkingOut && <ArrowRight size={16} color="#111" />}
            </TouchableOpacity>
            <View style={{ height:40 }} />
          </View>
        }
      />
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex:1, backgroundColor:"#FAFAF8" },
  header: { flexDirection:"row", alignItems:"baseline", gap:8, paddingHorizontal:20, paddingTop:56, paddingBottom:14, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F0F0F0" },
  title: { fontSize:22, fontWeight:"900", color:"#111" },
  count: { fontSize:13, color:"#AAA", fontWeight:"600" },
  list: { padding:16, gap:12 },
  cartItem: { flexDirection:"row", gap:12, backgroundColor:"#fff", borderRadius:18, padding:12 },
  itemImg: { width:76, height:76, borderRadius:14, resizeMode:"cover" },
  itemInfo: { flex:1, gap:4 },
  itemTitle: { fontSize:13, fontWeight:"700", color:"#111", lineHeight:17 },
  itemPrice: { fontSize:15, fontWeight:"900", color:"#111" },
  qtyRow: { flexDirection:"row", alignItems:"center", gap:8, marginTop:4 },
  qtyBtn: { width:28, height:28, backgroundColor:"#F5F5F3", borderRadius:8, alignItems:"center", justifyContent:"center" },
  qtyText: { fontSize:14, fontWeight:"800", color:"#111", minWidth:20, textAlign:"center" },
  removeBtn: { marginLeft:"auto" },
  summary: { marginTop:8, gap:12 },
  coinBox: { backgroundColor:"#FFF8E1", borderRadius:18, padding:16, borderWidth:1.5, borderColor:"#FFE082" },
  coinTitle: { fontSize:14, fontWeight:"800", color:"#111", flex:1 },
  coinBal: { fontSize:11, color:"#888" },
  coinOptions: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  coinOpt: { paddingHorizontal:12, paddingVertical:6, borderRadius:20, backgroundColor:"#fff", borderWidth:1.5, borderColor:"#E0E0E0" },
  coinOptActive: { backgroundColor:"#FFB800", borderColor:"#FFB800" },
  coinOptText: { fontSize:12, fontWeight:"700", color:"#666" },
  coinOptTextActive: { color:"#111" },
  coinSaving: { fontSize:12, fontWeight:"700", color:"#22C55E", marginTop:8 },
  totalBox: { backgroundColor:"#fff", borderRadius:18, padding:16, gap:8 },
  totalRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  totalLabel: { fontSize:13, color:"#888" },
  totalVal: { fontSize:13, fontWeight:"700", color:"#111" },
  grandLabel: { fontSize:15, fontWeight:"800", color:"#111" },
  grandVal: { fontSize:18, fontWeight:"900", color:"#111" },
  checkoutBtn: { backgroundColor:"#FFB800", borderRadius:18, height:54, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 },
  checkoutText: { fontSize:15, fontWeight:"900", color:"#111" },
  centered: { flex:1, alignItems:"center", justifyContent:"center", gap:12 },
  emptyTitle: { fontSize:16, fontWeight:"800", color:"#555" },
  shopBtn: { flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"#FFB800", borderRadius:16, paddingHorizontal:20, paddingVertical:12, marginTop:4 },
  shopBtnText: { fontSize:14, fontWeight:"800", color:"#111" },
  signInBtn: { backgroundColor:"#111", borderRadius:16, paddingHorizontal:24, paddingVertical:12 },
  signInText: { fontSize:14, fontWeight:"800", color:"#fff" },
});
