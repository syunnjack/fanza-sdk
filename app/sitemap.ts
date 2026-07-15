import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { providerItems } from "../db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "https://fanza-sdk.example.com";
  const paths = ["", "/providers", "/guides/hajimete", "/guides/privacy", "/guides/ranking-policy", "/categories/story", "/categories/costume", "/categories/romantic", "/categories/long-form", "/policies/editorial"];
  const staticEntries = paths.map((path, index) => ({ url: `${base}${path}`, lastModified: new Date("2026-07-15"), changeFrequency: index ? "monthly" as const : "weekly" as const, priority: index ? .7 : 1 }));

  try {
    const db = getDb();
    const rows = await db.select().from(providerItems).where(eq(providerItems.available, true)).limit(2000);
    const itemEntries = rows.map(row => ({
      url: `${base}/items/${row.providerId}/${row.providerItemId}`,
      lastModified: row.fetchedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    return [...staticEntries, ...itemEntries];
  } catch {
    return staticEntries;
  }
}
