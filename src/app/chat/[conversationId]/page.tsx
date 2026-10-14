"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Message = {
  _id: string;
  senderId: number;
  senderName: string;
  text: string;
  sentAt: string;
};

type Conversation = {
  _id: string;
  listingTitle: string;
  participants: { id: number; name: string }[];
};

export default function ChatThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`/api/chat/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => setMyId(me.id));
    fetchMessages();

    // Simple polling for near-real-time updates
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const res = await fetch(`/api/chat/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      setText("");
      fetchMessages();
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading chat...</p>
      </main>
    );
  }

  const otherPerson = conversation?.participants.find((p) => p.id !== myId);

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white"
        >
          ←
        </button>
        <div>
          <p className="font-semibold">{otherPerson?.name ?? "Chat"}</p>
          <p className="text-xs text-slate-500">{conversation?.listingTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-slate-500 text-sm text-center mt-10">
            Say hello — start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === myId;
            return (
              <div
                key={msg._id}
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? "bg-indigo-500 self-end rounded-br-sm"
                    : "bg-slate-800 self-start rounded-bl-sm"
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-[10px] opacity-60 mt-1">
                  {new Date(msg.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-800 px-6 py-4 flex gap-3"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-5 py-2.5 outline-none focus:border-indigo-400 transition-colors"
        />
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-400 transition-colors px-6 py-2.5 rounded-full font-medium"
        >
          Send
        </button>
      </form>
    </main>
  );
}