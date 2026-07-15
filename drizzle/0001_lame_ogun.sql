CREATE TABLE `provider_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_id` text NOT NULL,
	`provider_item_id` text NOT NULL,
	`title` text NOT NULL,
	`maker` text,
	`catalog_number` text,
	`price` integer,
	`affiliate_url` text NOT NULL,
	`source_type` text DEFAULT 'feed' NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `provider_item_unique` ON `provider_items` (`provider_id`,`provider_item_id`);