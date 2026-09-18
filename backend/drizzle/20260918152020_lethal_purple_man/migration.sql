CREATE TABLE "leads" (
	"company_name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"description" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"full_name" text NOT NULL,
	"id" uuid PRIMARY KEY,
	"location" text NOT NULL,
	"responsible_id" uuid NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"whatsapp" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"created_at" timestamp NOT NULL,
	"email" text NOT NULL UNIQUE,
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_responsible_id_sellers_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "sellers"("id");