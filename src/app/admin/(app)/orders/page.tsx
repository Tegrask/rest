"use client";

import { useEffect, useState } from "react";
import { formatCents, formatDateTime } from "@/lib/format";
import { Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Table {
  number: number;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  createdAt: string;
  table: Table;
  items: OrderItem[];
}

const statuses = ["ALL", "PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"];

const statusLabels: Record<string, string> = {
  PENDING: "Neu",
  PREPARING: "In Zubereitung",
  READY: "Fertig",
  SERVED: "Serviert",
  CANCELLED: "Storniert",
};

function OrdersList({ filter }: { filter: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders?status=${filter}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Bestellungen konnten nicht geladen werden.");
        setLoading(false);
      });
  }, [filter]);

  async function updateOrder(id: string, updates: Partial<Order>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      setError("Aktualisierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-zinc-500">Tisch {order.table.number}</p>
                <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium">
                  {statusLabels[order.status] || order.status}
                </span>
                {order.paymentStatus === "PAID" ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    Bezahlt
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                    Offen
                  </span>
                )}
              </div>
            </div>

            <ul className="mt-4 space-y-1 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-zinc-500">{formatCents(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
              <span className="font-semibold">{formatCents(order.total)}</span>
              <div className="flex gap-2">
                {order.status !== "SERVED" && order.status !== "CANCELLED" && (
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                  >
                    {statuses.filter((s) => s !== "ALL").map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s] || s}
                      </option>
                    ))}
                  </select>
                )}
                {order.paymentStatus !== "PAID" && (
                  <button
                    onClick={() => updateOrder(order.id, { paymentStatus: "PAID", paymentMethod: "CASH" })}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition hover:bg-green-700"
                  >
                    Bar bezahlt
                  </button>
                )}
                {order.status !== "CANCELLED" && (
                  <button
                    onClick={() => updateOrder(order.id, { status: "CANCELLED" })}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-200"
                  >
                    Stornieren
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <p className="text-center text-zinc-500">Keine Bestellungen vorhanden.</p>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  const [filter, setFilter] = useState("ALL");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bestellverwaltung</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filter === s
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 ring-1 ring-zinc-200"
            }`}
          >
            {s === "ALL" ? "Alle" : statusLabels[s] || s}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <OrdersList key={filter} filter={filter} />
      </div>
    </div>
  );
}
