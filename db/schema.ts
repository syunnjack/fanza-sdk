import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
