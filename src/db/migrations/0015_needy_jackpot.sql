CREATE TABLE `body_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`filename` text NOT NULL,
	`pose` text,
	`caption` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `body_logs` ADD `waist_cm` real;--> statement-breakpoint
ALTER TABLE `profiles` ADD `performance_phase` integer DEFAULT 1 NOT NULL;