const ENDPOINT = "https://api.dmm.com/affiliate/v3/ItemList";

const allowedSort = new Set(["rank", "date", "price", "review"]);

export async function GET(request: Request) {
  const apiId = process.env.DMM_API_ID;
  const affiliateId = process.env.DMM_AFFILIATE_ID;
  if (!apiId || !affiliateId) {
    return Response.json({ error: "API credentials are not configured." }, { status: 503 });
  }

  const input = new URL(request.url).searchParams;
  const keyword = (input.get("keyword") ?? "").trim().slice(0, 80);
  const sort = allowedSort.has(input.get("sort") ?? "") ? input.get("sort")! : "rank";
  const hits = Math.min(Math.max(Number(input.get("hits")) || 12, 1), 24);

  const params = new URLSearchParams({
    api_id: apiId,
    affiliate_id: affiliateId,
    site: "FANZA",
    service: "digital",
    floor: "videoa",
    hits: String(hits),
    sort,
    output: "json",
  });
  if (keyword) params.set("keyword", keyword);

  try {
    const response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!response.ok) return Response.json({ error: "Upstream API request failed." }, { status: 502 });
    const payload = await response.json() as { result?: { items?: unknown[]; total_count?: number } };
    return Response.json({
      items: payload.result?.items ?? [],
      totalCount: payload.result?.total_count ?? 0,
      fetchedAt: new Date().toISOString(),
      disclosure: "PR・広告を含みます。価格と配信状況は公式サイトで確認してください。",
    }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=1800" } });
  } catch {
    return Response.json({ error: "The API is temporarily unavailable." }, { status: 502 });
  }
}
