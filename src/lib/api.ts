import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";

/** Error with an HTTP status; thrown inside handlers and turned into `{ error }` JSON. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const badRequest = (m = "Invalid request.") => new HttpError(400, m);
export const unauthorized = (m = "You need to log in first.") => new HttpError(401, m);
export const forbidden = (m = "You don't have permission to do that.") => new HttpError(403, m);
export const notFound = (m = "Not found.") => new HttpError(404, m);
export const conflict = (m = "That already exists.") => new HttpError(409, m);

export type SessionUser = { id: number; role: AppRole; name: string };

/**
 * Returns the logged-in user or throws 401/403. The JWT gives id + role; one indexed
 * lookup also makes sure a deactivated account is locked out immediately.
 */
export async function requireUser(roles?: AppRole[]): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true, isActive: true },
  });
  if (!user || !user.isActive) throw unauthorized("Your session has ended. Please log in again.");
  if (roles && !roles.includes(user.role)) throw forbidden();
  return { id: user.id, role: user.role, name: user.name };
}

/** Like requireUser but returns null for anonymous visitors. */
export async function optionalUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role, name: session.user.name ?? "" };
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const body = await req.json().catch(() => {
    throw badRequest("Request body must be valid JSON.");
  });
  return schema.parse(body);
}

export function readQuery<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return schema.parse(params);
}

/** Parses a positive integer route id; malformed ids are a 400, never a 500. */
export function parseId(raw: string | undefined, label = "id"): number {
  if (!raw || !/^\d{1,10}$/.test(raw)) throw badRequest(`Invalid ${label}.`);
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) throw badRequest(`Invalid ${label}.`);
  return n;
}

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const r = rateLimit(key, limit, windowMs);
  if (!r.ok) throw new HttpError(429, `Too many requests. Try again in ${r.retryAfterSec}s.`);
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

type Ctx<P> = { params: Promise<P> };

/**
 * Wraps a route handler: maps HttpError / ZodError / known Prisma errors to clean JSON
 * responses with the right status code, and logs anything unexpected as a 500.
 */
export function route<P = Record<string, string>>(
  handler: (req: Request, ctx: Ctx<P>) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) return json({ error: err.message }, err.status);
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    return json({ error: `${field}${issue?.message ?? "Invalid input."}`, issues: err.issues }, 400);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return json({ error: "That already exists." }, 409);
    if (err.code === "P2025") return json({ error: "Not found." }, 404);
    if (err.code === "P2003") return json({ error: "A related record does not exist." }, 400);
  }
  // CHECK constraint / SIGNAL from triggers surface as raw DB errors: these are user mistakes.
  const message = err instanceof Error ? err.message : String(err);
  if (/Check constraint '([^']+)' is violated/.test(message)) {
    const name = message.match(/Check constraint '([^']+)'/)?.[1];
    return json({ error: `The data breaks a database rule (${name}).` }, 400);
  }
  console.error("[api] unexpected error", err);
  return json({ error: "Something went wrong on our side. Please try again." }, 500);
}
