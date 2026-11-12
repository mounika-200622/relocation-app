import { prisma } from "@/lib/prisma";
import { json, parseId, readJson, requireUser, route } from "@/lib/api";
import { loadOwnTrip } from "@/lib/trip/access";
import { tripUpdateSchema } from "@/lib/validators/trip";

type Ctx = { id: string };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const id = parseId((await params).id, "trip id");
  const user = await requireUser(["USER", "ADMIN"]);
  await loadOwnTrip(id, user.id);
  const input = await readJson(req, tripUpdateSchema);
  await prisma.itinerary.update({
    where: { id },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.split ? { pctStay: input.split.stay, pctFood: input.split.food, pctActivities: input.split.activities, pctTransport: input.split.transport } : {}),
    },
  });
  return json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const id = parseId((await params).id, "trip id");
  const user = await requireUser(["USER", "ADMIN"]);
  await loadOwnTrip(id, user.id);
  await prisma.itinerary.delete({ where: { id } }); // items + interests cascade
  return json({ ok: true });
});
