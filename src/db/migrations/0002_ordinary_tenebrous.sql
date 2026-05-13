CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`title` text NOT NULL,
	`project` text NOT NULL,
	`priority` text DEFAULT 'next' NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`deadline` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
