CREATE TABLE "comments" (
	"content" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"deal_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY,
	"seller_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_deal_id_deals_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id");--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_seller_id_sellers_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id");