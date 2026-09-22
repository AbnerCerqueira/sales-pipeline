CREATE TABLE "deals" (
	"created_at" timestamp NOT NULL,
	"description" text,
	"expected_close_date" date,
	"id" uuid PRIMARY KEY,
	"lead_id" uuid NOT NULL,
	"responsible_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"value" numeric(12,2)
);
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_responsible_id_sellers_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "sellers"("id");