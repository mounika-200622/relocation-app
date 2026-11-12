import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api";

/** Same 404 whether the trip doesn't exist or belongs to someone else. */
export async function loadOwnTrip(id: number, userId: number) {
  const t = await prisma.itinerary.findUnique({ where: { id }, select: { id: true, userId: true, title: true, currency: true, peopleCount: true, roomsNeeded: true, days: true } });
  if (!t || t.userId !== userId) throw notFound("Trip not found.");
  return t;
}
