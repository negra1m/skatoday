PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`access_code_id` text,
	`name` text NOT NULL,
	`birth_year` integer,
	`height_cm` integer,
	`starting_weight_kg` real,
	`goal` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`access_code_id`) REFERENCES `access_codes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_profiles`("id", "access_code_id", "name", "birth_year", "height_cm", "starting_weight_kg", "goal", "created_at") SELECT "id", "access_code_id", "name", "birth_year", "height_cm", "starting_weight_kg", "goal", "created_at" FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;