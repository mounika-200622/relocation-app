import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        city: { include: { country: true } },
        // Never expose owner email or password hash to the public.
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(listings);
  } catch (error) {
    console.error("Browse listings error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}