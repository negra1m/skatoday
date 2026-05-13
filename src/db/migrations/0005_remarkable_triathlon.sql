CREATE TABLE `water_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`goal_ml` integer,
	`glass_size_ml` integer DEFAULT 250 NOT NULL,
	`wake_start` text DEFAULT '08:00' NOT NULL,
	`wake_end` text DEFAULT '22:00' NOT NULL,
	`notifications_enabled` integer DEFAULT true NOT NULL,
	`sound_enabled` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `water_configs_profile_id_unique` ON `water_configs` (`profile_id`);--> statement-breakpoint
CREATE TABLE `water_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`glasses_drunk` integer DEFAULT 0 NOT NULL,
	`ml_drunk` integer DEFAULT 0 NOT NULL,
	`goal_ml_snapshot` integer,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `water_logs_profile_date` ON `water_logs` (`profile_id`,`date`);