"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  _id: string;
  listingTitle: string;
  participants: { id: number; name: string }[];
  lastMessageAt: string;
};

export default function ChatInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myId, setMyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => setMyId(me.id));

    fetch("/api/chat/list")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <p className="text-slate-400">Loading messages...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        {conversations.length === 0 ? (
          <p className="text-slate-400">No conversations yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map((conv) => {
              const other = conv.participants.find((p) => p.id !== myId);
              return (
                <Link
                  key={conv._id}
                  href={`/chat/${conv._id}`}
                  className="bg-slate-800/60 border border-slate-700 hover:border-indigo-400 transition-colors rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{other?.name ?? "Unknown"}</p>
                    <p className="text-slate-400 text-sm">{conv.listingTitle}</p>
                  </div>
                  <span className="text-slate-500 text-xs">
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}