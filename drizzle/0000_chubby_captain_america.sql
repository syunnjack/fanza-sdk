CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`body` text NOT NULL,
	`rating` integer NOT NULL,
	`helpful_axis` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`report_count` integer DEFAULT 0 NOT NULL,
	`policy_version` text DEFAULT '2026-07-15' NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer
);
