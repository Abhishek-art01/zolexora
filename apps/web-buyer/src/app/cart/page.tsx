"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, useAuthStore } from "@/store";
import { cartApi, coinsApi } from "@/lib/api";
import { Trash2, Plus, Minus, ShoppingBag, Coins, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, loading, fetch, updateQty, removeItem } = useCartStore();
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    fetch();
    coinsApi.balance().then((d) => setCoinBalance(d.coin_balance)).catch(() => {});
  }, [user]);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const maxCoinsForDiscount = Math.min(coinBalance, Math.floor((subtotal * 0.5) / 0.01));
  const coinDiscount = parseFloat((coinsToUse * 0.01).toFixed(2));
  const total = Math.max(0, subtotal - coinDiscount);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const res = await cartApi.checkout({ coins_to_use: coinsToUse, origin_url: "https://zolexora.com" });
      if (res.type === "razorpay") {
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY;
        const rzp = new (window as any).Razorpay({
          key: razorpayKey,
          amount: res.amount * 100,
          currency: "INR",
          order_id: res.razorpay_order_id,
          name: "Zolexora",
          description: "Order Payment",
          handler: async (response: any) => {
            await cartApi.checkout({ ...response, type: "verify" });
            toast.success("Payment successful! Order placed.");
            fetch();
            router.push("/orders");
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#FFB800" },
        });
        rzp.open();
      } else if (res.type === "coins") {
        toast.success("Order placed with coins!");
        fetch();
        router.push("/orders");
      } else {
        toast("Order saved. Payment gateway coming soon.", { icon: "ℹ️" });
        router.push("/orders");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Your Cart</h1>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShoppingBag size={48} className="text-gray-200 mb-4" />
          <h2 className="font-semibold text-lg text-gray-500">Your cart is empty</h2>
          <p className="text-sm text-gray-400 mt-1 mb-6">Find something you love</p>
          <Link href="/store" className="h-11 px-6 bg-gold rounded-xl flex items-center gap-2 font-semibold text-sm text-ink">
            Start Shopping <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div key={item.id} layout exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl p-4 flex gap-4 items-center border border-gray-50">
                  <Link href={`/product/${item.product_id}`}
                    className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    {item.product?.images?.[0]
                      ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    }
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink line-clamp-2">{item.product?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product?.category}</p>
                    <p className="font-bold text-sm text-ink mt-1">₹{item.product?.price?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button onClick={() => removeItem(item.product_id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-cream transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-cream transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Coin discount */}
            {coinBalance > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins size={16} className="text-gold" />
                  <span className="font-semibold text-sm text-ink">Use Coins</span>
                  <span className="ml-auto text-xs text-gray-500">{coinBalance} available</span>
                </div>
                <input type="range" min={0} max={maxCoinsForDiscount} step={10} value={coinsToUse}
                  onChange={(e) => setCoinsToUse(Number(e.target.value))}
                  className="w-full accent-gold" />
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-gray-500">{coinsToUse} coins</span>
                  <span className="font-bold text-green-600">- ₹{coinDiscount.toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-base text-ink mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                {coinDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coin discount</span><span>- ₹{coinDiscount.toFixed(0)}</span></div>}
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="text-green-600">{subtotal >= 499 ? "FREE" : "₹49"}</span></div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-base text-ink">
                  <span>Total</span>
                  <span>₹{(total + (subtotal < 499 ? 49 : 0)).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button onClick={handleCheckout} disabled={checkingOut || items.length === 0}
                className="w-full mt-5 h-12 bg-gold hover:bg-gold-dark rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-ink transition-all disabled:opacity-50">
                {checkingOut ? "Processing..." : "Proceed to Checkout"} {!checkingOut && <ArrowRight size={16} />}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-3">Secure checkout. Buyer protection included.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
