ALTER TABLE "payrush"."branding" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payrush"."clients" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payrush"."email_logs" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payrush"."invoices" ALTER COLUMN "user_id" SET DATA TYPE text;