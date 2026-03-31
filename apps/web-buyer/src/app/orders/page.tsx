"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { ordersApi } from "@/lib/api";
import { Package, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link"; 

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: "Pending",    color: "text-amber-600 bg-amber-50",  icon: Clock },
  processing: { label: "Processing", color: "text-blue-600 bg-blue-50",    icon: Package },
  shipped:    { label: "Shipped",    color: "text-purple-600 bg-purple-50", icon: Truck },
  delivered:  { label: "Delivered",  color: "text-green-600 bg-green-50",  icon: CheckCircle },
  cancelled:  { label: "Cancelled",  color: "text-red-500 bg-red-50",      icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    ordersApi.my().then(setOrders).finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-28 shimmer rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={48} className="text-gray-200 mb-4" />
          <h2 className="font-semibold text-lg text-gray-500">No orders yet</h2>
          <p className="text-sm text-gray-400 mt-1 mb-6">Your orders will appear here</p>
          <Link href="/store" className="h-11 px-6 bg-gold rounded-xl flex items-center font-semibold text-sm text-ink">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const Icon = st.icon;
            const expanded = expandedId === order.id;
            return (
              <motion.div key={order.id} layout className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setExpandedId(expanded ? null : order.id)} className="w-full flex items-center gap-4 p-4 text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${st.color.split(" ")[1]}`}>
                    <Icon size={17} className={st.color.split(" ")[0]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-ink">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} · ₹{order.total_paid?.toLocaleString("en-IN")} · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                  <Link href={`/orders/${order.id}`} onClick={e => e.stopPropagation()} className="ml-1 text-xs font-semibold text-gold hover:underline flex-shrink-0">Track</Link>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
                        {/* Items */}
                        {order.items?.map((item: any) => (
                          <div key={item.product_id} className="flex items-center gap-3">
                            {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-50" />}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-ink line-clamp-1">{item.product_title}</p>
                              <p className="text-xs text-gray-400">Qty {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                            </div>
                            <p className="text-sm font-bold text-ink">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                          </div>
                        ))}

                        {/* Summary */}
                        <div className="border-t border-gray-50 pt-3 space-y-1.5">
                          <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString("en-IN")}</span></div>
                          {order.coins_discount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Coin discount</span><span>- ₹{order.coins_discount}</span></div>}
                          <div className="flex justify-between text-sm font-bold text-ink"><span>Total Paid</span><span>₹{order.total_paid?.toLocaleString("en-IN")}</span></div>
                        </div>

                        {/* Status timeline */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {["pending", "processing", "shipped", "delivered"].map((s, i, arr) => {
                            const steps = ["pending", "processing", "shipped", "delivered"];
                            const currentIdx = steps.indexOf(order.status);
                            const stepIdx = steps.indexOf(s);
                            const done = stepIdx <= currentIdx && order.status !== "cancelled";
                            return (
                              <div key={s} className="flex items-center flex-1">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? "border-green-500 bg-green-500" : "border-gray-200 bg-white"}`}>
                                  {done && <CheckCircle size={10} className="text-white" />}
                                </div>
                                {i < arr.length - 1 && <div className={`flex-1 h-0.5 ${done && stepIdx < currentIdx ? "bg-green-500" : "bg-gray-100"}`} />}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 px-0.5">
                          {["Placed", "Processing", "Shipped", "Delivered"].map((l) => <span key={l}>{l}</span>)}
                        </div>
                        <Link href={`/track?order=${order.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline mt-2">
                          Track Shipment →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
