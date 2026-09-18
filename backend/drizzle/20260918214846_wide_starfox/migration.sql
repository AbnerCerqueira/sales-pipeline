ALTER TABLE "leads" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "description" DROP NOT NULL;