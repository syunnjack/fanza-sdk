import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "https://fanza-sdk.example.com";
  const paths = ["", "/providers", "/guides/hajimete", "/guides/privacy", "/guides/ranking-policy", "/categories/story", "/categories/costume", "/categories/romantic", "/categories/long-form", "/policies/editorial"];
  return paths.map((path, index) => ({ url: `${base}${path}`, lastModified: new Date("2026-07-15"), changeFrequency: index ? "monthly" : "weekly", priority: index ? .7 : 1 }));
}
