import { and, desc, eq, like } from "drizzle-orm";
import { getDb } from "../../../db";
import { providerItems } from "../../../db/schema";
import { providers } from "../../../lib/providers";
import { groupDuplicates, type CatalogItem } from "../../../lib/normalize";

const ENDPOINT = "https://api.dmm.com/affiliate/v3/ItemList";
const allowedSort = new Set(["rank", "date", "price", "review"]);
const providerNames = new Map(providers.map(p => [p.id, p.name]));

type DmmItem = {
  content_id?: string;
  title?: string;
  affiliateURL?: string;
  date?: string;
  prices?: { price?: string };
  iteminfo?: { genre?: Array<{ name?: string }> };
};

type ProviderItemRow = typeof providerItems.$inferSelect;

function fromDmm(item: DmmItem, fetchedAt: string): CatalogItem | null {
  if (!item.content_id || !item.title || !item.affiliateURL) return null;
  const price = item.prices?.price ? Number(item.prices.price.replace(/[^\d]/g, "")) : undefined;
  return {
    providerId: "fanza",
    providerItemId: item.content_id,
    title: item.title,
    price: Number.isFinite(price) ? price : undefined,
    currency: "JPY",
    available: true,
    affiliateUrl: item.affiliateURL,
    fetchedAt,
    sourceType: "api",
  };
}

function fromRow(row: ProviderItemRow): CatalogItem {
  return {
    providerId: row.providerId,
    providerItemId: row.providerItemId,
    title: row.title,
    maker: row.maker ?? undefined,
    catalogNumber: row.catalogNumber ?? undefined,
    price: row.price ?? undefined,
    currency: "JPY",
    available: row.available,
    affiliateUrl: row.affiliateUrl,
    fetchedAt: row.fetchedAt.toISOString(),
    sourceType: row.sourceType as CatalogItem["sourceType"],
  };
}

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams;
  const keyword = (input.get("keyword") ?? "").trim().slice(0, 80);
  const sort = allowedSort.has(input.get("sort") ?? "") ? input.get("sort")! : "rank";
  const hits = Math.min(Math.max(Number(input.get("hits")) || 12, 1), 24);
  const fetchedAt = new Date().toISOString();

  let liveItems: CatalogItem[] = [];
  let liveError: string | null = null;
  let dmmTotalCount: number | null = null;
  const dmmMetaById = new Map<string, { date?: string; genres: string[] }>();

  const apiId = process.env.DMM_API_ID;
  const affiliateId = process.env.DMM_AFFILIATE_ID;
  if (apiId && affiliateId) {
    const params = new URLSearchParams({ api_id: apiId, affiliate_id: affiliateId, site: "FANZA", service: "digital", floor: "videoa", hits: String(hits), sort, output: "json" });
    if (keyword) params.set("keyword", keyword);
    try {
      const response = await fetch(`${ENDPOINT}?${params}`, { headers: { Accept: "application/json" }, next: { revalidate: 1800 } });
      if (response.ok) {
        const payload = await response.json() as { result?: { items?: DmmItem[]; total_count?: number } };
        const rawItems = payload.result?.items ?? [];
        dmmTotalCount = payload.result?.total_count ?? null;
        for (const raw of rawItems) {
          const item = fromDmm(raw, fetchedAt);
          if (!item) continue;
          liveItems.push(item);
          dmmMetaById.set(raw.content_id!, { date: raw.date, genres: (raw.iteminfo?.genre ?? []).map(g => g.name).filter((n): n is string => Boolean(n)) });
        }
      } else {
        liveError = "Upstream API request failed.";
      }
    } catch {
      liveError = "The API is temporarily unavailable.";
    }
  }

  // Write-through cache: keeps /items/{provider}/{id} pages and the sitemap warm even between
  // live searches, and lets a briefly-unavailable DMM API still serve recently-seen titles.
  if (liveItems.length) {
    const db = getDb();
    for (const item of liveItems) {
      try {
        await db.insert(providerItems).values({
          providerId: item.providerId,
          providerItemId: item.providerItemId,
          title: item.title,
          price: item.price ?? null,
          affiliateUrl: item.affiliateUrl,
          sourceType: "api",
          available: true,
          fetchedAt: new Date(fetchedAt),
        }).onConflictDoUpdate({
          target: [providerItems.providerId, providerItems.providerItemId],
          set: { title: item.title, price: item.price ?? null, affiliateUrl: item.affiliateUrl, available: true, fetchedAt: new Date(fetchedAt) },
        });
      } catch {
        // Cache warm is best-effort; the live search results below are unaffected.
      }
    }
  }

  let cachedItems: CatalogItem[] = [];
  try {
    const db = getDb();
    const condition = keyword ? and(eq(providerItems.available, true), like(providerItems.title, `%${keyword}%`)) : eq(providerItems.available, true);
    const rows = await db.select().from(providerItems).where(condition).orderBy(desc(providerItems.fetchedAt)).limit(30);
    cachedItems = rows.map(fromRow);
  } catch {
    // DB is optional for the search endpoint; live results (if any) are still returned.
  }

  // Cached rows from the live provider (fanza) duplicate what we just fetched; prefer the fresh copy
  // and let cached rows from every other provider fill in the cross-store comparison.
  const liveKeys = new Set(liveItems.map(i => `${i.providerId}:${i.providerItemId}`));
  const merged = [...liveItems, ...cachedItems.filter(i => !liveKeys.has(`${i.providerId}:${i.providerItemId}`))];

  if (!merged.length && liveError) {
    return Response.json({ error: liveError }, { status: 502 });
  }

  const groups = groupDuplicates(merged).slice(0, hits);
  const items = groups.map(group => {
    const primary = group.find(i => i.providerId === "fanza") ?? group[0];
    const meta = dmmMetaById.get(primary.providerItemId);
    const otherProviderIds = [...new Set(group.filter(i => i.providerId !== primary.providerId).map(i => i.providerId))];
    return {
      productId: `${primary.providerId}:${primary.providerItemId}`,
      providerId: primary.providerId,
      providerName: providerNames.get(primary.providerId) ?? primary.providerId,
      title: primary.title,
      price: primary.price ?? null,
      date: meta?.date ?? null,
      genres: meta?.genres ?? [],
      affiliateUrl: primary.affiliateUrl,
      sourceType: primary.sourceType,
      alsoAvailableFrom: otherProviderIds.map(id => providerNames.get(id) ?? id),
    };
  });

  return Response.json({
    items,
    totalCount: dmmTotalCount ?? merged.length,
    fetchedAt,
    disclosure: "PR・広告を含みます。価格と配信状況は公式サイトで確認してください。",
  }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=1800" } });
}
