CREATE TABLE "access_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"share_token" varchar NOT NULL,
	"client_ip" varchar,
	"user_agent" text,
	"accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deliverables" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"file_path" varchar,
	"file_name" varchar,
	"file_size" integer,
	"mime_type" varchar,
	"uploader_id" varchar,
	"uploader_type" varchar DEFAULT 'freelancer' NOT NULL,
	"uploader_name" varchar,
	"type" varchar DEFAULT 'deliverable' NOT NULL,
	"status" varchar DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"client_name" varchar NOT NULL,
	"rating" integer,
	"comment" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"invoice_number" varchar NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"file_path" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"parent_message_id" varchar,
	"thread_id" varchar,
	"sender_name" varchar NOT NULL,
	"sender_type" varchar NOT NULL,
	"message_type" varchar DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"status" varchar DEFAULT 'sent' NOT NULL,
	"is_read" boolean DEFAULT false,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"edited_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"freelancer_id" varchar NOT NULL,
	"client_name" varchar NOT NULL,
	"client_email" varchar,
	"share_token" varchar NOT NULL,
	"token_expiry" timestamp DEFAULT NOW() + INTERVAL '90 days' NOT NULL,
	"access_count" integer DEFAULT 0,
	"last_accessed" timestamp,
	"status" varchar DEFAULT 'active' NOT NULL,
	"progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"business_name" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_access_logs_project_id" ON "access_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_access_logs_share_token" ON "access_logs" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "idx_access_logs_accessed_at" ON "access_logs" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "idx_access_logs_client_ip" ON "access_logs" USING btree ("client_ip");--> statement-breakpoint
CREATE INDEX "idx_access_logs_project_accessed" ON "access_logs" USING btree ("project_id","accessed_at");--> statement-breakpoint
CREATE INDEX "idx_deliverables_project_id" ON "deliverables" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_deliverables_uploader_type" ON "deliverables" USING btree ("uploader_type");--> statement-breakpoint
CREATE INDEX "idx_deliverables_status" ON "deliverables" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_deliverables_created_at" ON "deliverables" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_deliverables_file_path" ON "deliverables" USING btree ("file_path");--> statement-breakpoint
CREATE INDEX "idx_deliverables_project_type" ON "deliverables" USING btree ("project_id","type");--> statement-breakpoint
CREATE INDEX "idx_feedback_project_id" ON "feedback" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_rating" ON "feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_feedback_is_public" ON "feedback" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_feedback_created_at" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_feedback_project_rating" ON "feedback" USING btree ("project_id","rating");--> statement-breakpoint
CREATE INDEX "idx_invoices_project_id" ON "invoices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_created_at" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_invoices_invoice_number" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoices_project_status" ON "invoices" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "idx_messages_project_id" ON "messages" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_messages_thread_id" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_messages_parent_message_id" ON "messages" USING btree ("parent_message_id");--> statement-breakpoint
CREATE INDEX "idx_messages_sender_type" ON "messages" USING btree ("sender_type");--> statement-breakpoint
CREATE INDEX "idx_messages_is_read" ON "messages" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_priority" ON "messages" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_messages_project_unread" ON "messages" USING btree ("project_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_messages_project_created" ON "messages" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_projects_freelancer_id" ON "projects" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "idx_projects_share_token" ON "projects" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_projects_last_accessed" ON "projects" USING btree ("last_accessed");--> statement-breakpoint
CREATE INDEX "idx_projects_freelancer_status" ON "projects" USING btree ("freelancer_id","status");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");