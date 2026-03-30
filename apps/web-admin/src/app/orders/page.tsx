"use client";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

const S: Record<string,string> = { pending:"bg-amber-50 text-amber-700", processing:"bg-blue-50 text-blue-700", shipped:"bg-purple-50 text-purple-700", delivered:"bg-green-50 text-green-700", cancelled:"bg-red-50 text-red-600" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { adminApi.orders().then(setOrders).finally(() => setLoading(false)); }, []);

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !search || o.buyer_name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRevenue = orders.filter(o => o.payment_status === "paid").reduce((s,o) => s + o.total_paid, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Orders</h1>
          <p className="text-ink-muted text-sm mt-0.5">{orders.length} total · ₹{totalRevenue.toLocaleString("en-IN")} revenue</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buyer name or order ID..."
            className="h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gold w-64" />
        </div>
        {["all","pending","processing","shipped","delivered","cancelled"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`h-9 px-4 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter===s ? "bg-ink text-white" : "bg-white border border-gray-200 text-ink-muted"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-gray-100">
              <tr>{["Order ID","Buyer","Seller","Items","Amount","Payment","Status","Date"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-ink-muted whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({length:8}).map((_,i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-8 shimmer rounded-lg" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-ink-muted">No orders found</td></tr>
              ) : filtered.map((o,i) => (
                <motion.tr key={o.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
                  className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">#{o.id.slice(0,8).toUpperCase()}</td>
                  <td className="px-4 py-3 font-medium text-ink">{o.buyer_name}</td>
                  <td className="px-4 py-3 text-ink-muted text-xs">{o.seller_name}</td>
                  <td className="px-4 py-3 text-ink-muted">{o.items?.length}</td>
                  <td className="px-4 py-3 font-bold text-ink">₹{o.total_paid?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${o.payment_status==="paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${S[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"})}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
