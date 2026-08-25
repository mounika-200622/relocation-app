"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "BOTH" }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed.");
      return;
    }

    router.push("/choose-path");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-slate-400 text-sm">
            Join and start exploring where life takes you next.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1 block">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-lg py-2.5 font-medium disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}