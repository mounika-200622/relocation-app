import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { conversationId } = await params;

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db("nira");

    const conversation = await db
      .collection("conversations")
      .findOne({ _id: new ObjectId(conversationId) });

    if (!conversation || !conversation.participantIds.includes(me.id)) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const messages = await db
      .collection("messages")
      .find({ conversationId })
      .sort({ sentAt: 1 })
      .toArray();

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { conversationId } = await params;
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db("nira");

    const conversation = await db
      .collection("conversations")
      .findOne({ _id: new ObjectId(conversationId) });

    if (!conversation || !conversation.participantIds.includes(me.id)) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const message = {
      conversationId,
      senderId: me.id,
      senderName: me.name,
      text: text.trim(),
      sentAt: new Date(),
    };

    await db.collection("messages").insertOne(message);
    await db
      .collection("conversations")
      .updateOne(
        { _id: new ObjectId(conversationId) },
        { $set: { lastMessageAt: new Date() } }
      );

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}