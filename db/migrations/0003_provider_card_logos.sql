ALTER TABLE "providers" RENAME COLUMN "logo_url" TO "landing_image_url";--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "logo_url" text;