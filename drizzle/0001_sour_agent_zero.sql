CREATE TYPE "public"."lead_categoria" AS ENUM('empresario', 'designer', 'entusiasta', 'indefinido');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "classificacao" "lead_categoria" DEFAULT 'indefinido' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "sinais" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "classificadoEm" timestamp with time zone;