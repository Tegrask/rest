"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2 } from "lucide-react";

interface Table {
  id: string;
  number: number;
  name: string | null;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data) => {
        setTables(data);
        setOrigin(typeof window !== "undefined" ? window.location.origin : "");
        setLoading(false);
      })
      .catch(() => {
        setError("Tische konnten nicht geladen werden.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">QR-Codes für Tische</h1>
      <p className="text-zinc-500">Drucke die Codes aus und lege sie auf die Tische.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => {
          const url = `${origin}/table/${table.number}`;
          return (
            <div
              key={table.id}
              className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
            >
              <h2 className="text-lg font-semibold">Tisch {table.number}</h2>
              <p className="text-sm text-zinc-500">{url}</p>
              <div className="mt-4 rounded-xl bg-white p-2">
                <QRCodeSVG value={url} size={160} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
