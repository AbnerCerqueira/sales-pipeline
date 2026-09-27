-- As linhas existentes foram gravadas em UTC; o cast abaixo depende do
-- TimeZone da sessão. Ver ADR-009.
SET TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "expected_close_date" SET DATA TYPE timestamp with time zone USING "expected_close_date"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sellers" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;
