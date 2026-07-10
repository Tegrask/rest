"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@restaurant.local");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loginLocal(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "local", email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login fehlgeschlagen.");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Login fehlgeschlagen.");
      setLoading(false);
    }
  }

  async function loginNxcode() {
    setLoading(true);
    setError(null);

    const appId = process.env.NEXT_PUBLIC_NXCODE_APP_ID;
    if (!appId) {
      setError("Nxcode ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    try {
      const { default: Nxcode } = await import("@nxcode/sdk");
      Nxcode.configure(appId);
      await Nxcode.ready();

      await Nxcode.auth.login("google");
      const token = Nxcode.auth.getToken();

      if (!token) {
        setError("Kein Nxcode Token erhalten.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "nxcode", token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login fehlgeschlagen.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nxcode Login fehlgeschlagen.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <h1 className="text-2xl font-semibold">Personal-Login</h1>
        <p className="text-sm text-zinc-500">Melde dich als Admin oder Mitarbeiter an.</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={loginLocal} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Anmelden
          </button>
        </form>

        {process.env.NEXT_PUBLIC_NXCODE_APP_ID && (
          <div className="mt-6">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-200" />
              <span className="mx-3 text-xs text-zinc-400">oder</span>
              <div className="flex-grow border-t border-zinc-200" />
            </div>
            <button
              onClick={loginNxcode}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white py-2.5 text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Mit Nxcode anmelden
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
