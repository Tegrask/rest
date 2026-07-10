"use client";

import { useEffect, useState } from "react";
import { formatCents, formatDateTime } from "@/lib/format";
import { CheckCircle2, ChefHat, Clock, UtensilsCrossed } from "lucide-react";

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
  status: "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
  total: number;
  createdAt: string;
  table: Table;
  items: OrderItem[];
}

const statusConfig = {
  PENDING: { label: "Neu", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  PREPARING: { label: "In Zubereitung", color: "bg-blue-100 text-blue-800", icon: ChefHat },
  READY: { label: "Fertig", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  SERVED: { label: "Serviert", color: "bg-zinc-100 text-zinc-800", icon: UtensilsCrossed },
  CANCELLED: { label: "Storniert", color: "bg-red-100 text-red-800", icon: UtensilsCrossed },
};

const statusFlow: Order["status"][] = ["PENDING", "PREPARING", "READY", "SERVED"];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders?status=ALL");
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setOrders(data.filter((o: Order) => o.status !== "SERVED" && o.status !== "CANCELLED"));
      } catch {
        setError("Bestellungen konnten nicht geladen werden.");
      }
    }
    loadOrders();

    const es = new EventSource("/api/orders/stream");
    es.addEventListener("NEW_ORDER", (event) => {
      const data = JSON.parse(event.data);
      setOrders((prev) => [data.order, ...prev]);
    });
    es.addEventListener("ORDER_UPDATED", (event) => {
      const data = JSON.parse(event.data);
      setOrders((prev) => {
        const updated = prev.map((o) => (o.id === data.order.id ? data.order : o));
        return updated.filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED");
      });
    });
    es.onopen = () => setConnected(true);
    es.onerror = () => {
      setConnected(false);
      setError("Verbindung zum Küchen-Monitor unterbrochen.");
    };

    return () => es.close();
  }, []);

  async function updateStatus(id: string, status: Order["status"]) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setOrders((prev) => {
        const list = prev.map((o) => (o.id === updated.id ? updated : o));
        return list.filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED");
      });
    } catch {
      setError("Status konnte nicht aktualisiert werden.");
    }
  }

  function nextStatus(status: Order["status"]) {
    const index = statusFlow.indexOf(status);
    if (index === -1 || index === statusFlow.length - 1) return status;
    return statusFlow[index + 1];
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Küchen-Monitor</h1>
            <p className="text-sm text-zinc-500">Live-Ansicht aller Bestellungen</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-zinc-600">{connected ? "Live" : "Offline"}</span>
          </div>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        {orders.length === 0 ? (
          <p className="text-center text-zinc-500">Keine offenen Bestellungen.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => {
              const cfg = statusConfig[order.status];
              const Icon = cfg.icon;
              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-500">Tisch {order.table.number}</p>
                      <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-1 text-sm text-zinc-700">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="text-zinc-500">{formatCents(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                    <span className="font-semibold">{formatCents(order.total)}</span>
                    <div className="flex gap-2">
                      {order.status !== "CANCELLED" && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatus(order.status))}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
                        >
                          {order.status === "READY" ? "Servieren" : "Weiter"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
