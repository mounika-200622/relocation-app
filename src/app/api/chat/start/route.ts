import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId." }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.ownerId === me.id) {
      return NextResponse.json(
        { error: "You can't message your own listing." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nira");
    const conversations = db.collection("conversations");

    // Look for an existing conversation between these two users for this listing
    let conversation = await conversations.findOne({
      listingId: listing.id,
      participantIds: { $all: [me.id, listing.ownerId] },
    });

    if (!conversation) {
      const result = await conversations.insertOne({
        listingId: listing.id,
        listingTitle: listing.title,
        participantIds: [me.id, listing.ownerId],
        participants: [
          { id: me.id, name: me.name },
          { id: listing.ownerId, name: listing.owner.name },
        ],
        createdAt: new Date(),
        lastMessageAt: new Date(),
      });
      conversation = await conversations.findOne({ _id: result.insertedId });
    }

    return NextResponse.json({ conversationId: conversation?._id.toString() });
  } catch (error) {
    console.error("Start chat error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}