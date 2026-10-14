import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
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

    const {
      title,
      type,
      address,
      country,
      city,
      price,
      currency,
      isShareable,
      capacityMin,
      capacityMax,
      currentOccupants,
      preference,
      photos,
    } = await req.json();

    if (!title || !type || !address || !country || !city || !price) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Find or create the country
    const countryRecord = await prisma.country.upsert({
      where: { name: country },
      update: {},
      create: { name: country },
    });

    // Find or create the city under that country
    let cityRecord = await prisma.city.findFirst({
      where: { name: city, countryId: countryRecord.id },
    });

    if (!cityRecord) {
      cityRecord = await prisma.city.create({
        data: { name: city, countryId: countryRecord.id },
      });
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: owner.id,
        cityId: cityRecord.id,
        type,
        title,
        address,
        price: parseFloat(price),
        currency: currency || "USD",
        isShareable: !!isShareable,
        capacityMin: capacityMin || 1,
        capacityMax: capacityMax || 1,
        currentOccupants: currentOccupants || 0,
        preference: preference || "ANYONE",
        photos: JSON.stringify(photos || []),
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Listing creation error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}