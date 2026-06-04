CREATE SCHEMA "payrush";
--> statement-breakpoint
CREATE TABLE "payrush"."branding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"logo_url" text,
	"primary_color" text DEFAULT '#185FA5',
	"business_name" text,
	"bank_name" text,
	"account_name" text,
	"account_number" text,
	"mobile_money_number" text,
	"payment_instructions" text,
	"template" text DEFAULT 'modern',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "branding_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "payrush"."clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"currency" text DEFAULT 'ZMW',
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payrush"."email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid,
	"user_id" uuid,
	"recipient_email" text,
	"subject" text,
	"status" text,
	"resend_id" text,
	"sent_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payrush"."invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric DEFAULT '1',
	"unit_price" numeric NOT NULL,
	"amount" numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "payrush"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid,
	"invoice_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"currency" text DEFAULT 'ZMW' NOT NULL,
	"status" text DEFAULT 'draft',
	"due_date" date,
	"paid_at" timestamp with time zone,
	"payment_method" text,
	"payment_notes" text,
	"public_token" uuid DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payrush"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"phone" text,
	"address" text,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now()
);
