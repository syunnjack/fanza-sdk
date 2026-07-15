import { getDb } from "../../../db";
import { reviews } from "../../../db/schema";

const axes = new Set(["ストーリー", "価格", "長さ", "雰囲気", "公式情報の分かりやすさ"]);
const blocked = [/https?:\/\//i, /@/, /\b(?:LINE|電話番号|住所)\b/i];

export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    const body = String(input.body ?? "").trim();
    const productId = String(input.productId ?? "general").slice(0, 80);
    const helpfulAxis = String(input.helpfulAxis ?? "");
    const rating = Number(input.rating);
    const startedAt = Number(input.startedAt);
    if (input.website || !Number.isFinite(startedAt) || Date.now() - startedAt < 3000) return Response.json({ error: "投稿を受け付けられません。" }, { status: 400 });
    if (body.length < 20 || body.length > 400 || blocked.some(rule => rule.test(body))) return Response.json({ error: "本文を確認してください。URL・連絡先・個人情報は投稿できません。" }, { status: 400 });
    if (!axes.has(helpfulAxis) || !Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: "評価項目を確認してください。" }, { status: 400 });
    await getDb().insert(reviews).values({ productId, body, rating, helpfulAxis, status: "pending", createdAt: new Date() });
    return Response.json({ ok: true, status: "pending", message: "審査待ちとして受け付けました。" }, { status: 202 });
  } catch {
    return Response.json({ error: "投稿を保存できませんでした。" }, { status: 503 });
  }
}
