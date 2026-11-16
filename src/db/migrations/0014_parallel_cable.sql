CREATE TABLE `workout_circuit_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`notifications_enabled` integer DEFAULT true NOT NULL,
	`window_start` text DEFAULT '08:00' NOT NULL,
	`window_end` text DEFAULT '20:00' NOT NULL,
	`reminders_per_day` integer DEFAULT 3 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_circuit_configs_profile_id_unique` ON `workout_circuit_configs` (`profile_id`);--> statement-breakpoint
CREATE TABLE `workout_circuit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`done` integer DEFAULT true NOT NULL,
	`rounds` integer,
	`duration_minutes` integer,
	`notes` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_circuit_logs_profile_date` ON `workout_circuit_logs` (`profile_id`,`date`);