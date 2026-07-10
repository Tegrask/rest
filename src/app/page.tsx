import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Restaurant Bestellsystem
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          QR-Code Speisekarte, Küchen-Live-Ansicht, Admin-Dashboard und Online-Zahlung.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            href="/table/1"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
          >
            <h2 className="text-lg font-medium">Gast Menü</h2>
            <p className="mt-2 text-sm text-zinc-500">Tisch 1 (Demo)</p>
          </Link>
          <Link
            href="/kitchen"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
          >
            <h2 className="text-lg font-medium">Küche</h2>
            <p className="mt-2 text-sm text-zinc-500">Live-Bestellungen</p>
          </Link>
          <Link
            href="/admin"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
          >
            <h2 className="text-lg font-medium">Admin</h2>
            <p className="mt-2 text-sm text-zinc-500">Dashboard & Umsatz</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
