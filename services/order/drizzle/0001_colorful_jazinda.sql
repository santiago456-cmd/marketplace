CREATE TABLE "order_events" (
	"order_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "order_events_order_id_version_pk" PRIMARY KEY("order_id","version")
);
