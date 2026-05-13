CREATE TABLE `access_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`owner_name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_codes_code_unique` ON `access_codes` (`code`);--> statement-breakpoint
CREATE TABLE `body_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real,
	`body_fat_pct` real,
	`visceral_fat` real,
	`muscle_mass_kg` real,
	`water_pct` real,
	`energy` integer,
	`mood` integer,
	`sleep_hours` real,
	`notes` text,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `body_logs_profile_date` ON `body_logs` (`profile_id`,`date`);--> statement-breakpoint
CREATE TABLE `jiu_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`duration_minutes` integer,
	`rolls` integer,
	`intensity` integer,
	`notes` text,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`access_code_id` text NOT NULL,
	`name` text NOT NULL,
	`birth_year` integer,
	`height_cm` integer,
	`starting_weight_kg` real,
	`goal` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`access_code_id`) REFERENCES `access_codes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `routine_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`task_key` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_checks_profile_date_task` ON `routine_checks` (`profile_id`,`date`,`task_key`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`distance_km` real,
	`duration_minutes` real,
	`pace` text,
	`type` text,
	`notes` text,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_tricks` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`trick_id` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lands` integer DEFAULT 0 NOT NULL,
	`misses` integer DEFAULT 0 NOT NULL,
	`best_streak` integer DEFAULT 0 NOT NULL,
	`is_base_run` integer DEFAULT false NOT NULL,
	`notes` text,
	FOREIGN KEY (`session_id`) REFERENCES `skate_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trick_id`) REFERENCES `tricks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skate_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`duration_minutes` integer,
	`location` text,
	`session_type` text,
	`feeling` integer,
	`confidence` integer,
	`pain` integer,
	`flow_state` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skate_sessions_profile_date` ON `skate_sessions` (`profile_id`,`date`);--> statement-breakpoint
CREATE TABLE `tricks` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`stance` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'descobrindo' NOT NULL,
	`base_requirement` integer DEFAULT 10 NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
