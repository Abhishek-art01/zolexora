"use client";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Users, Package, Video, ShoppingBag, TrendingUp, Eye, UserCheck, Store, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.analytics()])
      .then(([s, a]) => { setStats(s); setAnalytics(a); })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label:"Total Users",      value:stats.total_users,     icon:Users,     color:"bg-blue-50 text-blue-600",   href:"/users" },
    { label:"Buyers",           value:stats.viewers,         icon:UserCheck, color:"bg-teal-50 text-teal-600",   href:"/users" },
    { label:"Sellers",          value:stats.sellers,         icon:Store,     color:"bg-purple-50 text-purple-600",href:"/users" },
    { label:"Products",         value:stats.active_products, icon:Package,   color:"bg-orange-50 text-orange-600",href:"/products" },
    { label:"Total Reels",      value:stats.total_reels,     icon:Video,     color:"bg-pink-50 text-pink-600",   href:"/reels" },
    { label:"Sponsored Reels",  value:stats.sponsored_reels, icon:Zap,       color:"bg-gold/10 text-amber-700",  href:"/reels" },
    { label:"Paid Orders",      value:stats.paid_orders,     icon:ShoppingBag,color:"bg-green-50 text-green-600",href:"/orders" },
    { label:"Reel Views",       value:stats.total_reel_views,icon:Eye,       color:"bg-indigo-50 text-indigo-600",href:"/analytics" },
  ] : [];

  const growthData = analytics ? [
    { name:"Users 7d",  value:analytics.new_users_7d },
    { name:"Users 30d", value:analytics.new_users_30d },
    { name:"Orders 7d", value:analytics.orders_7d },
    { name:"Orders 30d",value:analytics.orders_30d },
  ] : [];

  const T = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return <div className="bg-white rounded-xl border border-gray-100 shadow px-3 py-2 text-xs"><p className="font-bold text-ink">{label}: {payload[0].value}</p></div>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Platform Overview</h1>
        <p className="text-ink-muted text-sm mt-0.5">Real-time stats for Zolexora</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {loading ? Array.from({length:8}).map((_,i)=>(
          <div key={i} className="h-24 shimmer rounded-2xl col-span-1" />
        )) : cards.map((c,i) => (
          <motion.div key={c.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
            <Link href={c.href} className="block bg-white rounded-2xl p-3.5 border border-gray-100 hover:shadow-sm transition-all">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${c.color.split(" ")[0]}`}>
                <c.icon size={15} className={c.color.split(" ")[1]} />
              </div>
              <p className="font-display text-xl font-bold text-ink">{c.value?.toLocaleString()}</p>
              <p className="text-[10px] text-ink-muted mt-0.5 leading-tight">{c.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Growth charts */}
      {analytics && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-display text-sm font-bold text-ink mb-4">Growth Metrics</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={growthData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:"#888" }} />
                <YAxis tick={{ fontSize:10, fill:"#888" }} allowDecimals={false} />
                <Tooltip content={<T />} />
                <Bar dataKey="value" fill="#FFB800" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-display text-sm font-bold text-ink mb-4">Quick Stats</h2>
            <div className="space-y-3">
              {[
                { label:"New users (7d)",        value:analytics.new_users_7d,        color:"text-blue-600" },
                { label:"New users (30d)",        value:analytics.new_users_30d,       color:"text-blue-600" },
                { label:"New orders (7d)",        value:analytics.orders_7d,           color:"text-green-600" },
                { label:"New orders (30d)",       value:analytics.orders_30d,          color:"text-green-600" },
                { label:"Reel views (30d)",       value:analytics.reels_views_30d,     color:"text-purple-600" },
                { label:"Coin earns (30d)",       value:analytics.coins_earned_30d,    color:"text-amber-600" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending actions */}
      {stats && stats.pending_orders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center"><ShoppingBag size={17} className="text-amber-700" /></div>
            <div><p className="font-semibold text-amber-900 text-sm">{stats.pending_orders} orders need attention</p>
              <p className="text-amber-700 text-xs">Pending or processing status</p></div>
          </div>
          <Link href="/orders" className="h-9 px-4 bg-amber-900 text-white rounded-xl text-xs font-bold hover:bg-amber-800 transition-colors flex items-center">Review Orders</Link>
        </div>
      )}
    </div>
  );
}
