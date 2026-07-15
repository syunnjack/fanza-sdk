import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { reviews } from "../../../../db/schema";

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_SECRET;
  const supplied = request.headers.get("x-admin-secret");
  return Boolean(expected) && supplied === expected;
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const pending = await db.select().from(reviews).where(eq(reviews.status, "pending")).orderBy(desc(reviews.createdAt)).limit(100);
    return Response.json({ reviews: pending });
  } catch {
    return Response.json({ error: "Could not load reviews." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const id = Number(body.id);
  const action = body.action;
  if (!Number.isInteger(id) || (action !== "approve" && action !== "reject")) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const db = getDb();
    await db.update(reviews).set({ status: action === "approve" ? "approved" : "rejected", reviewedAt: new Date() }).where(eq(reviews.id, id));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not update review." }, { status: 503 });
  }
}
