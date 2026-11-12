import { prisma } from "@/lib/prisma";
import { json, notFound, readJson, requireUser, route } from "@/lib/api";
import { entityByKey, schemaFor } from "@/lib/admin-entities";

type Ctx = { entity: string };
type Delegate = { findMany: (a: object) => Promise<unknown[]>; create: (a: object) => Promise<unknown> };

function delegate(model: string) {
  return (prisma as unknown as Record<string, Delegate>)[model]!;
}

/** ADMIN: list rows of a guide/content table (optionally for one country). */
export const GET = route<Ctx>(async (req, { params }) => {
  await requireUser(["ADMIN"]);
  const def = entityByKey((await params).entity);
  if (!def) throw notFound("Unknown content type.");
  const countryId = Number(new URL(req.url).searchParams.get("countryId")) || undefined;
  const hasCountry = def.fields.some((f) => f.name === "countryId");
  const rows = await delegate(def.model).findMany({ where: hasCountry && countryId ? { countryId } : {}, orderBy: def.orderBy, take: 500 });
  return json({ rows });
});

export const POST = route<Ctx>(async (req, { params }) => {
  await requireUser(["ADMIN"]);
  const def = entityByKey((await params).entity);
  if (!def) throw notFound("Unknown content type.");
  const data = await readJson(req, schemaFor(def));
  const row = await delegate(def.model).create({ data });
  return json(row, 201);
});
