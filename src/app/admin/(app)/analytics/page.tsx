"use client";

import { useEffect, useState } from "react";
import { formatCents } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

interface DayData {
  date: string;
  revenue: number;
  orders: number;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics?days=${days}`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        setData(json.map((d: DayData) => ({ ...d, date: d.date.slice(5) })));
      } catch {
        setError("Umsatzdaten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Umsatzstatistik</h1>
          <p className="text-zinc-500">Täglicher Umsatz und Bestellungen</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value={7}>Letzte 7 Tage</option>
          <option value={14}>Letzte 14 Tage</option>
          <option value={30}>Letzte 30 Tage</option>
        </select>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <p className="text-sm text-zinc-500">Gesamtumsatz</p>
          <p className="text-2xl font-semibold">{formatCents(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <p className="text-sm text-zinc-500">Bestellungen</p>
          <p className="text-2xl font-semibold">{totalOrders}</p>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="mt-6 h-80 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `€${(v / 100).toFixed(0)}`} />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? formatCents(value) : String(value)
                }
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="revenue" name="Umsatz" fill="#18181b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
