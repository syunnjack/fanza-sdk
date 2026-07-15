import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: text("product_id").notNull(),
  body: text("body").notNull(),
  rating: integer("rating").notNull(),
  helpfulAxis: text("helpful_axis").notNull(),
  status: text("status").notNull().default("pending"),
  reportCount: integer("report_count").notNull().default(0),
  policyVersion: text("policy_version").notNull().default("2026-07-15"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
});

export const providerItems = sqliteTable("provider_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: text("provider_id").notNull(),
  providerItemId: text("provider_item_id").notNull(),
  title: text("title").notNull(),
  maker: text("maker"),
  catalogNumber: text("catalog_number"),
  price: integer("price"),
  affiliateUrl: text("affiliate_url").notNull(),
  sourceType: text("source_type").notNull().default("feed"),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
}, table => [uniqueIndex("provider_item_unique").on(table.providerId, table.providerItemId)]);
