ALTER TABLE "deals" ADD COLUMN "position" integer;--> statement-breakpoint
UPDATE "deals" SET "position" = "ranked"."rn" FROM (SELECT "id", row_number() OVER (ORDER BY "created_at" DESC, "id" DESC) AS "rn" FROM "deals") AS "ranked" WHERE "deals"."id" = "ranked"."id";--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "position" SET NOT NULL;