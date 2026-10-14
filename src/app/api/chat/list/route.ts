import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db("nira");

    const conversations = await db
      .collection("conversations")
      .find({ participantIds: me.id })
      .sort({ lastMessageAt: -1 })
      .toArray();

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("List conversations error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}