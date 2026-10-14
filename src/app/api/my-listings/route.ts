import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const owner = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!owner) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const listings = await prisma.listing.findMany({
      where: { ownerId: owner.id },
      include: { city: { include: { country: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Fetch listings error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}