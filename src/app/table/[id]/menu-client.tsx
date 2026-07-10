"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCents } from "@/lib/format";
import { Minus, Plus, ShoppingCart, Trash2, Check, CreditCard, Loader2 } from "lucide-react";

interface Table {
  id: string;
  number: number;
  name: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MenuClient({ table }: { table: Table }) {
  const [menu, setMenu] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<{ id: string; total: number } | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setMenu(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Menü konnte nicht geladen werden.");
        setLoading(false);
      });
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setShowCart(true);
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }

  async function placeOrder() {
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: table.id,
          items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bestellung fehlgeschlagen.");
        return;
      }
      setOrder({ id: data.id, total: data.total });
      setCart([]);
      setShowCart(false);
    } catch {
      setError("Bestellung fehlgeschlagen.");
    }
  }

  async function pay() {
    if (!order) return;
    setPaying(true);
    setError(null);

    try {
      let token = "";
      const appId = process.env.NEXT_PUBLIC_NXCODE_APP_ID;

      if (appId) {
        const { default: Nxcode } = await import("@nxcode/sdk");
        Nxcode.configure(appId);
        await Nxcode.ready();

        if (!Nxcode.auth.isLoggedIn()) {
          await Nxcode.auth.login("google");
        }

        token = Nxcode.auth.getToken() || "";
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Zahlung fehlgeschlagen.");
        setPaying(false);
        return;
      }
      setPaying(false);
      setOrder({ ...order, total: 0 }); // mark as paid
    } catch {
      setError("Zahlung konnte nicht abgeschlossen werden.");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (order) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">Bestellung aufgegeben</h2>
          <p className="mt-2 text-zinc-600">
            Tisch {table.number} &middot; {formatCents(order.total)}
          </p>
          {order.total === 0 ? (
            <p className="mt-6 rounded-lg bg-green-50 px-4 py-2 text-green-700">Bezahlt</p>
          ) : (
            <button
              onClick={pay}
              disabled={paying}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Jetzt bezahlen
            </button>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button
            onClick={() => setOrder(null)}
            className="mt-4 text-sm text-zinc-500 underline"
          >
            Weitere Bestellung
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Speisekarte</h1>
            <p className="text-sm text-zinc-500">Tisch {table.number}</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative rounded-full bg-zinc-900 p-3 text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-6">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        {menu.map((category) => (
          <section key={category.id} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">{category.name}</h2>
            <div className="grid gap-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
                >
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-zinc-500">{item.description}</p>
                    )}
                    <p className="mt-1 font-medium text-zinc-900">{formatCents(item.price)}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="rounded-full bg-zinc-900 p-2 text-white transition hover:bg-zinc-800"
                    aria-label="Hinzufügen"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {showCart && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/50">
          <div className="flex w-full max-w-md flex-col bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Warenkorb</h2>
              <button onClick={() => setShowCart(false)} className="text-zinc-500">
                Schließen
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="mt-8 text-center text-zinc-500">Warenkorb ist leer.</p>
            ) : (
              <>
                <div className="mt-6 flex-1 space-y-4 overflow-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-zinc-500">{formatCents(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded-full bg-zinc-100 p-1"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-full bg-zinc-100 p-1"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateQuantity(item.id, 0)}
                          className="ml-2 text-red-500"
                          aria-label="Entfernen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Gesamt</span>
                    <span>{formatCents(total)}</span>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="mt-4 w-full rounded-lg bg-zinc-900 py-3 text-white transition hover:bg-zinc-800"
                  >
                    Bestellen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
