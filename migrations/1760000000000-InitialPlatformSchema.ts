import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPlatformSchema1760000000000 implements MigrationInterface {
  name = 'InitialPlatformSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM ('active','inactive','suspended');
      CREATE TYPE "technician_status_enum" AS ENUM ('available','busy','travelling','offline','on_break');
      CREATE TYPE "site_type_enum" AS ENUM ('municipality','school','office','warehouse','retail_store','other');
      CREATE TYPE "activity_type_enum" AS ENUM ('fiber_installation','router_installation','firewall_installation','wifi_survey','troubleshooting','maintenance','hardware_replacement','other');
      CREATE TYPE "activity_priority_enum" AS ENUM ('low','medium','high','critical');
      CREATE TYPE "activity_status_enum" AS ENUM ('draft','unassigned','scheduled','travelling','in_progress','paused','completed','cancelled','delayed');
      CREATE TYPE "preferred_time_slot_enum" AS ENUM ('morning','afternoon','specific_time','flexible');
      CREATE TYPE "assignment_source_enum" AS ENUM ('automatic','manual','optimized');
      CREATE TYPE "assignment_status_enum" AS ENUM ('suggested','assigned','accepted','rejected','cancelled','completed');
      CREATE TYPE "attachment_type_enum" AS ENUM ('photo','pdf','document','installation_report');
      CREATE TYPE "notification_channel_enum" AS ENUM ('email','sms','push','whatsapp');
      CREATE TYPE "notification_status_enum" AS ENUM ('pending','processing','sent','delivered','failed','cancelled');

      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar NOT NULL UNIQUE,
        "description" varchar, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar NOT NULL UNIQUE,
        "description" varchar, "resource" varchar NOT NULL, "action" varchar NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "email" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL, "full_name" varchar NOT NULL, "role_id" uuid NOT NULL,
        "status" user_status_enum NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_users_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
      );
      CREATE TABLE "role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "role_id" uuid NOT NULL, "permission_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "uq_role_permissions" UNIQUE ("role_id","permission_id"),
        CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      );
      CREATE TABLE "user_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "permission_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_permissions" UNIQUE ("user_id","permission_id"),
        CONSTRAINT "fk_user_permissions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      );
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "token" varchar NOT NULL, "user_id" uuid NOT NULL,
        "expires_at" timestamp NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "is_revoked" boolean NOT NULL DEFAULT false,
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id");
      CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens" ("token");

      CREATE TABLE "customers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "company_name" varchar(160) NOT NULL,
        "vat_number" varchar(32) NOT NULL UNIQUE, "contact_person" varchar(120) NOT NULL,
        "email" varchar(255) NOT NULL, "phone" varchar(32) NOT NULL, "notes" text,
        "is_active" boolean NOT NULL DEFAULT true, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "idx_customers_company_name" ON "customers" ("company_name");
      CREATE TABLE "customer_sites" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "customer_id" uuid NOT NULL, "name" varchar(120) NOT NULL DEFAULT 'Main site',
        "site_type" site_type_enum NOT NULL DEFAULT 'other', "address_line_1" varchar(180) NOT NULL, "address_line_2" varchar(180),
        "city" varchar(100) NOT NULL, "province" varchar(100) NOT NULL, "region" varchar(100) NOT NULL,
        "postal_code" varchar(16) NOT NULL, "country" varchar(2) NOT NULL DEFAULT 'IT',
        "latitude" numeric(9,6) NOT NULL, "longitude" numeric(9,6) NOT NULL,
        "contact_person" varchar(120), "contact_phone" varchar(32), "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_customer_sites_name" UNIQUE ("customer_id","name"),
        CONSTRAINT "fk_customer_sites_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "ck_customer_sites_latitude" CHECK ("latitude" BETWEEN -90 AND 90),
        CONSTRAINT "ck_customer_sites_longitude" CHECK ("longitude" BETWEEN -180 AND 180)
      );
      CREATE INDEX "idx_customer_sites_coordinates" ON "customer_sites" ("latitude","longitude");

      CREATE TABLE "vehicles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "registration_number" varchar(32) NOT NULL UNIQUE,
        "make" varchar(80) NOT NULL, "model" varchar(80) NOT NULL, "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE "technician_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL UNIQUE,
        "first_name" varchar(80) NOT NULL, "last_name" varchar(80) NOT NULL, "phone" varchar(32) NOT NULL,
        "vehicle_id" uuid, "status" technician_status_enum NOT NULL DEFAULT 'offline',
        "max_daily_minutes" smallint NOT NULL DEFAULT 480, "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_technician_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_technician_profiles_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL,
        CONSTRAINT "ck_technician_daily_minutes" CHECK ("max_daily_minutes" BETWEEN 60 AND 1440)
      );
      CREATE INDEX "idx_technician_profiles_status" ON "technician_profiles" ("status");
      CREATE TABLE "skills" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(100) NOT NULL UNIQUE, "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE "certifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(120) NOT NULL UNIQUE, "issuer" varchar(120), "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE "technician_skills" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "technician_id" uuid NOT NULL, "skill_id" uuid NOT NULL,
        "proficiency" smallint NOT NULL DEFAULT 1, "years_experience" numeric(4,1),
        CONSTRAINT "uq_technician_skills" UNIQUE ("technician_id","skill_id"),
        CONSTRAINT "fk_technician_skills_technician" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_technician_skills_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE,
        CONSTRAINT "ck_technician_skill_proficiency" CHECK ("proficiency" BETWEEN 1 AND 5)
      );
      CREATE TABLE "technician_certifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "technician_id" uuid NOT NULL, "certification_id" uuid NOT NULL,
        "certificate_number" varchar(100), "issued_at" date, "expires_at" date,
        CONSTRAINT "uq_technician_certifications" UNIQUE ("technician_id","certification_id"),
        CONSTRAINT "fk_technician_certifications_technician" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_technician_certifications_certification" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_certification_dates" CHECK ("expires_at" IS NULL OR "issued_at" IS NULL OR "expires_at" >= "issued_at")
      );
      CREATE TABLE "technician_regions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "technician_id" uuid NOT NULL, "region" varchar(100) NOT NULL, "is_primary" boolean NOT NULL DEFAULT false,
        CONSTRAINT "uq_technician_regions" UNIQUE ("technician_id","region"),
        CONSTRAINT "fk_technician_regions_technician" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE
      );

      CREATE TABLE "activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "reference_number" varchar(32) NOT NULL UNIQUE,
        "customer_id" uuid NOT NULL, "site_id" uuid NOT NULL, "title" varchar(180) NOT NULL, "description" text,
        "type" activity_type_enum NOT NULL, "priority" activity_priority_enum NOT NULL DEFAULT 'medium',
        "status" activity_status_enum NOT NULL DEFAULT 'unassigned', "estimated_duration_minutes" smallint NOT NULL,
        "preferred_time_slot" preferred_time_slot_enum NOT NULL DEFAULT 'flexible', "preferred_date" date,
        "preferred_start_time" time, "preferred_end_time" time, "scheduled_start" timestamptz, "scheduled_end" timestamptz,
        "actual_start" timestamptz, "actual_end" timestamptz, "equipment_required" text, "internal_notes" text,
        "created_by_id" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_activities_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_activities_site" FOREIGN KEY ("site_id") REFERENCES "customer_sites"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_activities_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_activity_duration" CHECK ("estimated_duration_minutes" BETWEEN 15 AND 1440),
        CONSTRAINT "ck_activity_preferred_times" CHECK ("preferred_end_time" IS NULL OR "preferred_start_time" IS NULL OR "preferred_end_time" > "preferred_start_time"),
        CONSTRAINT "ck_activity_scheduled_times" CHECK ("scheduled_end" IS NULL OR "scheduled_start" IS NULL OR "scheduled_end" > "scheduled_start"),
        CONSTRAINT "ck_activity_actual_times" CHECK ("actual_end" IS NULL OR "actual_start" IS NULL OR "actual_end" >= "actual_start")
      );
      CREATE INDEX "idx_activities_status_schedule" ON "activities" ("status","scheduled_start");
      CREATE INDEX "idx_activities_customer_created" ON "activities" ("customer_id","created_at");
      CREATE INDEX "idx_activities_priority" ON "activities" ("priority");
      CREATE TABLE "activity_assignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "activity_id" uuid NOT NULL, "technician_id" uuid NOT NULL,
        "source" assignment_source_enum NOT NULL, "status" assignment_status_enum NOT NULL DEFAULT 'suggested',
        "rank" smallint, "score" numeric(5,2), "distance_km" numeric(8,2), "travel_time_minutes" smallint,
        "available_at" timestamptz, "estimated_arrival_at" timestamptz, "scheduled_start" timestamptz, "scheduled_end" timestamptz,
        "assigned_by_id" uuid, "override_reason" text, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_assignments_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_assignments_technician" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_assignments_assigned_by" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "ck_assignment_rank" CHECK ("rank" IS NULL OR "rank" > 0),
        CONSTRAINT "ck_assignment_score" CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100),
        CONSTRAINT "ck_assignment_schedule" CHECK ("scheduled_end" IS NULL OR "scheduled_start" IS NULL OR "scheduled_end" > "scheduled_start")
      );
      CREATE INDEX "idx_assignments_activity_technician_status" ON "activity_assignments" ("activity_id","technician_id","status");
      CREATE UNIQUE INDEX "uq_active_activity_assignment" ON "activity_assignments" ("activity_id") WHERE "status" IN ('assigned','accepted');
      CREATE INDEX "idx_technician_assignment_schedule" ON "activity_assignments" ("technician_id","scheduled_start","scheduled_end") WHERE "status" IN ('assigned','accepted');
      CREATE TABLE "activity_status_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "activity_id" uuid NOT NULL,
        "from_status" activity_status_enum, "to_status" activity_status_enum NOT NULL, "changed_by_id" uuid, "reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_status_history_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_status_history_user" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
      CREATE INDEX "idx_status_history_activity_created" ON "activity_status_history" ("activity_id","created_at");
      CREATE TABLE "activity_attachments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "activity_id" uuid NOT NULL, "type" attachment_type_enum NOT NULL,
        "file_name" varchar(255) NOT NULL, "storage_key" varchar(500) NOT NULL UNIQUE, "mime_type" varchar(120) NOT NULL,
        "size_bytes" bigint NOT NULL, "uploaded_by_id" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_attachments_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_attachments_user" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_attachment_size" CHECK ("size_bytes" > 0)
      );
      CREATE INDEX "idx_attachments_activity_created" ON "activity_attachments" ("activity_id","created_at");
      CREATE TABLE "activity_notes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "activity_id" uuid NOT NULL, "author_id" uuid NOT NULL,
        "content" text NOT NULL, "is_internal" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_activity_notes_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_activity_notes_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT
      );
      CREATE INDEX "idx_activity_notes_activity_created" ON "activity_notes" ("activity_id","created_at");
      CREATE TABLE "customer_signatures" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "activity_id" uuid NOT NULL, "signer_name" varchar(120) NOT NULL,
        "signer_role" varchar(100), "signature_storage_key" varchar(500) NOT NULL, "signed_at" timestamptz NOT NULL,
        "ip_address" inet, "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_customer_signatures_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE
      );
      CREATE INDEX "idx_customer_signatures_activity_signed" ON "customer_signatures" ("activity_id","signed_at");

      CREATE TABLE "technician_locations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "technician_id" uuid NOT NULL,
        "latitude" numeric(9,6) NOT NULL, "longitude" numeric(9,6) NOT NULL, "accuracy_meters" numeric(7,2),
        "speed_kph" numeric(6,2), "heading_degrees" numeric(5,2), "recorded_at" timestamptz NOT NULL, "received_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_technician_locations_technician" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "ck_location_latitude" CHECK ("latitude" BETWEEN -90 AND 90),
        CONSTRAINT "ck_location_longitude" CHECK ("longitude" BETWEEN -180 AND 180),
        CONSTRAINT "ck_location_speed" CHECK ("speed_kph" IS NULL OR "speed_kph" >= 0),
        CONSTRAINT "ck_location_heading" CHECK ("heading_degrees" IS NULL OR "heading_degrees" BETWEEN 0 AND 360)
      );
      CREATE INDEX "idx_locations_technician_recorded" ON "technician_locations" ("technician_id","recorded_at" DESC);
      CREATE INDEX "idx_locations_recorded" ON "technician_locations" ("recorded_at");

      CREATE TABLE "route_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "technician_id" uuid NOT NULL, "route_date" date NOT NULL,
        "provider" varchar(40), "total_distance_km" numeric(9,2), "total_travel_minutes" integer,
        "optimized_at" timestamptz, "optimization_metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_route_plans_technician_date" UNIQUE ("technician_id","route_date"),
        CONSTRAINT "fk_route_plans_technician" FOREIGN KEY ("technician_id") REFERENCES "technician_profiles"("id") ON DELETE CASCADE
      );
      CREATE TABLE "route_stops" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "route_plan_id" uuid NOT NULL, "activity_id" uuid NOT NULL, "sequence" smallint NOT NULL,
        "estimated_arrival_at" timestamptz, "estimated_departure_at" timestamptz,
        "distance_from_previous_km" numeric(8,2), "travel_minutes_from_previous" smallint,
        CONSTRAINT "uq_route_stops_sequence" UNIQUE ("route_plan_id","sequence"),
        CONSTRAINT "uq_route_stops_activity" UNIQUE ("route_plan_id","activity_id"),
        CONSTRAINT "fk_route_stops_plan" FOREIGN KEY ("route_plan_id") REFERENCES "route_plans"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_route_stops_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "ck_route_stop_sequence" CHECK ("sequence" > 0)
      );
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "activity_id" uuid, "user_id" uuid,
        "channel" notification_channel_enum NOT NULL, "status" notification_status_enum NOT NULL DEFAULT 'pending',
        "recipient" varchar(255) NOT NULL, "subject" varchar(180), "body" text NOT NULL,
        "scheduled_at" timestamptz, "sent_at" timestamptz, "delivered_at" timestamptz,
        "provider_message_id" varchar(255), "failure_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_notifications_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "ck_notification_target" CHECK ("activity_id" IS NOT NULL OR "user_id" IS NOT NULL)
      );
      CREATE INDEX "idx_notifications_status_scheduled" ON "notifications" ("status","scheduled_at");
      CREATE TABLE "customer_feedback" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "activity_id" uuid NOT NULL UNIQUE, "customer_id" uuid NOT NULL,
        "rating" smallint NOT NULL, "comments" text, "submitted_by" varchar(120), "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_feedback_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_feedback_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "ck_feedback_rating" CHECK ("rating" BETWEEN 1 AND 5)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "customer_feedback" CASCADE;
      DROP TABLE IF EXISTS "notifications" CASCADE;
      DROP TABLE IF EXISTS "route_stops" CASCADE;
      DROP TABLE IF EXISTS "route_plans" CASCADE;
      DROP TABLE IF EXISTS "technician_locations" CASCADE;
      DROP TABLE IF EXISTS "customer_signatures" CASCADE;
      DROP TABLE IF EXISTS "activity_notes" CASCADE;
      DROP TABLE IF EXISTS "activity_attachments" CASCADE;
      DROP TABLE IF EXISTS "activity_status_history" CASCADE;
      DROP TABLE IF EXISTS "activity_assignments" CASCADE;
      DROP TABLE IF EXISTS "activities" CASCADE;
      DROP TABLE IF EXISTS "technician_regions" CASCADE;
      DROP TABLE IF EXISTS "technician_certifications" CASCADE;
      DROP TABLE IF EXISTS "technician_skills" CASCADE;
      DROP TABLE IF EXISTS "certifications" CASCADE;
      DROP TABLE IF EXISTS "skills" CASCADE;
      DROP TABLE IF EXISTS "technician_profiles" CASCADE;
      DROP TABLE IF EXISTS "vehicles" CASCADE;
      DROP TABLE IF EXISTS "customer_sites" CASCADE;
      DROP TABLE IF EXISTS "customers" CASCADE;
      DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
      DROP TABLE IF EXISTS "user_permissions" CASCADE;
      DROP TABLE IF EXISTS "role_permissions" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TABLE IF EXISTS "permissions" CASCADE;
      DROP TABLE IF EXISTS "roles" CASCADE;
      DROP TYPE IF EXISTS "notification_status_enum";
      DROP TYPE IF EXISTS "notification_channel_enum";
      DROP TYPE IF EXISTS "attachment_type_enum";
      DROP TYPE IF EXISTS "assignment_status_enum";
      DROP TYPE IF EXISTS "assignment_source_enum";
      DROP TYPE IF EXISTS "preferred_time_slot_enum";
      DROP TYPE IF EXISTS "activity_status_enum";
      DROP TYPE IF EXISTS "activity_priority_enum";
      DROP TYPE IF EXISTS "activity_type_enum";
      DROP TYPE IF EXISTS "site_type_enum";
      DROP TYPE IF EXISTS "technician_status_enum";
      DROP TYPE IF EXISTS "user_status_enum";
    `);
  }
}
