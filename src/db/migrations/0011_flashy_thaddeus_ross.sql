CREATE TABLE `traffic_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`property_ref` text,
	`property_url` text,
	`price_brl` real,
	`daily_budget_brl` real,
	`monthly_budget_brl` real,
	`commission_pct` real,
	`objective` text,
	`status` text DEFAULT 'planejando' NOT NULL,
	`started_at` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `traffic_checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`section` text NOT NULL,
	`label` text NOT NULL,
	`detail` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `traffic_campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `traffic_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`item_id` text NOT NULL,
	`period` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `traffic_campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `traffic_checklist_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `traffic_checks_item_period` ON `traffic_checks` (`item_id`,`period`);--> statement-breakpoint
CREATE TABLE `traffic_daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`date` text NOT NULL,
	`spend_brl` real,
	`conversations` integer,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `traffic_campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `traffic_daily_logs_campaign_date` ON `traffic_daily_logs` (`campaign_id`,`date`);--> statement-breakpoint
CREATE TABLE `traffic_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`date` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`source_ref` text,
	`stage` text DEFAULT 'novo' NOT NULL,
	`registered_in_crm` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `traffic_campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
