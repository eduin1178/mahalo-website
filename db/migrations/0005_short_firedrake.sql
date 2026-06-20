CREATE TYPE "public"."plan_speed_unit" AS ENUM('Mbps', 'Gbps');--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "speed" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "speed_value" numeric;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "speed_unit" "plan_speed_unit";--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "speed_mbps" integer;