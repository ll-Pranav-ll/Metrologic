CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"brand" varchar(255) NOT NULL,
	"status" varchar(32) NOT NULL,
	"complianceScore" integer NOT NULL,
	"inspectorNotes" text,
	"extractedData" jsonb NOT NULL,
	"evaluation" jsonb NOT NULL,
	"evidence" jsonb NOT NULL,
	"regionFlags" jsonb NOT NULL,
	"reportKey" varchar(512),
	"reportUrl" varchar(1024),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
