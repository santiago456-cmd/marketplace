CREATE TABLE "stock_reservations" (
	"order_id" uuid PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"lines" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
