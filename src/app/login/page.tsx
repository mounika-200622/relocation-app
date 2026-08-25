"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/choose-path");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Log in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="Your password"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-indigo-500 hover:bg-indigo-400 transition-colors rounded-lg py-2.5 font-medium disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}