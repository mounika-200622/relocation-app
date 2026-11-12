import { prisma } from "@/lib/prisma";
import { route } from "@/lib/api";

/** Amenity catalogue for filters and the listing form. */
export const GET = route(async () => {
  const rows = await prisma.amenity.findMany({ select: { id: true, code: true, label: true }, orderBy: { label: "asc" } });
  return Response.json(rows, { headers: { "Cache-Control": "public, max-age=3600" } });
});
