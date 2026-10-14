"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Listing = {
  id: number;
  title: string;
  address: string;
  price: number;
  currency: string;
  photos: string;
  city: { name: string; country: { name: string } };
};

export default function RelocatePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/browse-listings")
      .then((r) => r.json())
      .then((data) => {
        setListings(data);
        setLoading(false);
      });
  }, []);

  const handleMessage = async (listingId: number) => {
    const res = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/chat/${data.conversationId}`);
    } else {
      alert(data.error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <p className="text-slate-400">Loading listings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Available Places</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Messages
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {listings.map((listing) => {
            const photos: string[] = JSON.parse(listing.photos || "[]");
            return (
              <div
                key={listing.id}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex items-center gap-4"
              >
                {photos[0] && (
                  <img
                    src={photos[0]}
                    alt={listing.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-semibold">{listing.title}</h2>
                  <p className="text-slate-400 text-sm">
                    {listing.city.name}, {listing.city.country.name}
                  </p>
                  <p className="text-indigo-400 text-sm font-medium">
                    {listing.currency} {listing.price}/mo
                  </p>
                </div>
                <button
                  onClick={() => handleMessage(listing.id)}
                  className="bg-indigo-500 hover:bg-indigo-400 transition-colors px-4 py-2 rounded-full text-sm font-medium"
                >
                  Message owner
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}