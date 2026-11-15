import { prisma } from "@/lib/prisma";
import { json, notFound, parseId, readJson, requireUser, route } from "@/lib/api";
import { entityByKey, schemaFor } from "@/lib/admin-entities";
import { deleteEmbedding, reindexGuideSoon } from "@/lib/vector/store";

type Ctx = { entity: string; id: string };
type Delegate = { update: (a: object) => Promise<unknown>; delete: (a: object) => Promise<unknown> };
const delegate = (model: string) => (prisma as unknown as Record<string, Delegate>)[model]!;

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireUser(["ADMIN"]);
  const p = await params;
  const def = entityByKey(p.entity);
  if (!def) throw notFound("Unknown content type.");
  const id = parseId(p.id);
  const data = await readJson(req, schemaFor(def, true));
  // drop keys the client didn't send so a partial update doesn't null them
  const body = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  const row = await delegate(def.model).update({ where: { id }, data: body });
  if (def.model === "guideArticle") reindexGuideSoon(id);
  return json(row);
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  await requireUser(["ADMIN"]);
  const p = await params;
  const def = entityByKey(p.entity);
  if (!def) throw notFound("Unknown content type.");
  const id = parseId(p.id);
  await delegate(def.model).delete({ where: { id } });
  if (def.model === "guideArticle") await deleteEmbedding("guide", id);
  return json({ ok: true });
});
