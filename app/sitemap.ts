import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { providerItems } from "../db/schema";
import { catalogItemFromRow, groupDuplicates, pickPrimary } from "../lib/normalize";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "https://hikakulab.jp";
  const paths = ["", "/providers", "/guides/hajimete", "/guides/privacy", "/guides/ranking-policy", "/categories/story", "/categories/costume", "/categories/romantic", "/categories/long-form", "/policies/editorial"];
  const staticEntries = paths.map((path, index) => ({ url: `${base}${path}`, lastModified: new Date("2026-07-15"), changeFrequency: index ? "monthly" as const : "weekly" as const, priority: index ? .7 : 1 }));

  try {
    const db = getDb();
    const rows = await db.select().from(providerItems).where(eq(providerItems.available, true)).limit(2000);
    // Only the canonical (primary) URL of each cross-provider duplicate group is listed here;
    // the other providers' pages for the same work carry a canonical link to this URL instead
    // of competing with it as near-duplicate content.
    const groups = groupDuplicates(rows.map(catalogItemFromRow));
    const itemEntries = groups.map(group => {
      const primary = pickPrimary(group);
      const sourceRow = rows.find(row => row.providerId === primary.providerId && row.providerItemId === primary.providerItemId);
      return {
        url: `${base}/items/${primary.providerId}/${primary.providerItemId}`,
        lastModified: sourceRow?.fetchedAt ?? new Date(primary.fetchedAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    });
    return [...staticEntries, ...itemEntries];
  } catch {
    return staticEntries;
  }
}
