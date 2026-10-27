ALTER TABLE `exercises` ADD `pattern` text;--> statement-breakpoint
ALTER TABLE `exercises` ADD `min_level` integer;--> statement-breakpoint
ALTER TABLE `exercises` ADD `max_level` integer;--> statement-breakpoint
ALTER TABLE `exercises` ADD `unit` text DEFAULT 'reps' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` ADD `execucao` text;--> statement-breakpoint
ALTER TABLE `exercises` ADD `erros_comuns` text;--> statement-breakpoint
ALTER TABLE `exercises` ADD `regressao` text;--> statement-breakpoint
ALTER TABLE `exercises` ADD `progressao` text;--> statement-breakpoint
ALTER TABLE `gym_sets` ADD `seconds` integer;--> statement-breakpoint
ALTER TABLE `gym_sets` ADD `rpe` integer;--> statement-breakpoint
ALTER TABLE `profiles` ADD `calisthenics_level` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `workouts` ADD `level` integer;--> statement-breakpoint
ALTER TABLE `workouts` ADD `block` text;