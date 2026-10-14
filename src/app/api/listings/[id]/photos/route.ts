import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await params;
    const listingId = parseInt(id);

    const owner = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.ownerId !== owner?.id) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const { photo } = await req.json();

    if (!photo) {
      return NextResponse.json({ error: "No photo provided." }, { status: 400 });
    }

    const existingPhotos: string[] = JSON.parse(listing.photos || "[]");
    const updatedPhotos = [...existingPhotos, photo];

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { photos: JSON.stringify(updatedPhotos) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}