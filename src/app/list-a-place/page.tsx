"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrencyForCountry } from "@/lib/currency";

export default function ListAPlacePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "APARTMENT",
    address: "",
    country: "",
    city: "",
    price: "",
    isShareable: false,
    capacityMin: 1,
    capacityMax: 1,
    currentOccupants: 0,
    preference: "ANYONE",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currency = getCurrencyForCountry(form.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, currency, photos: [] }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/my-listings");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">List your place</h1>
          <p className="text-slate-400 text-sm">
            Add the details — people looking to move can find and message you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
              placeholder="Sunny 2-bed near city center"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
            >
              <option value="APARTMENT">Apartment</option>
              <option value="DORM">Dorm</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
                placeholder="Switzerland"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
                placeholder="Zurich"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
              placeholder="Bahnhofstrasse 12"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Monthly price ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                {currency}
              </span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-16 pr-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
                placeholder="900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Can accommodate (min)
              </label>
              <input
                type="number"
                min={1}
                value={form.capacityMin}
                onChange={(e) =>
                  setForm({ ...form, capacityMin: parseInt(e.target.value) || 1 })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Can accommodate (max)
              </label>
              <input
                type="number"
                min={1}
                value={form.capacityMax}
                onChange={(e) =>
                  setForm({ ...form, capacityMax: parseInt(e.target.value) || 1 })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Already living there
            </label>
            <input
              type="number"
              min={0}
              value={form.currentOccupants}
              onChange={(e) =>
                setForm({ ...form, currentOccupants: parseInt(e.target.value) || 0 })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">
              Preference for remaining spots
            </label>
            <select
              value={form.preference}
              onChange={(e) => setForm({ ...form, preference: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
            >
              <option value="ANYONE">Open to anyone</option>
              <option value="FEMALE_ONLY">Females only</option>
              <option value="MALE_ONLY">Males only</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isShareable}
              onChange={(e) => setForm({ ...form, isShareable: e.target.checked })}
              className="accent-indigo-500"
            />
            Open to roommates / shared occupancy
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-lg py-2.5 font-medium disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}