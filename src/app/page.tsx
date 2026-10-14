import Link from "next/link";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
});

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6">
      <div className="text-center max-w-xl">
        <h1 className={`${playfair.className} text-7xl mb-6`}>
          Nira<span className="text-indigo-400">.</span>
        </h1>
        <p className="text-slate-400 text-lg mb-10">
          Wherever you're headed, Nira gets you settled.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-indigo-500 hover:bg-indigo-400 transition-colors px-6 py-3 rounded-full font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-slate-700 hover:border-slate-500 transition-colors px-6 py-3 rounded-full font-medium"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}