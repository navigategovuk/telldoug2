-- Migration: Add Foreign Key Constraints
-- Purpose: Enforce referential integrity across all tables
-- Date: 2026-01-26
-- 
-- This migration adds explicit FK constraints with appropriate cascade rules:
-- - CASCADE: Child records deleted when parent is deleted
-- - SET NULL: Reference nullified when parent is deleted
-- - RESTRICT: Prevent deletion of parent if children exist

-- ============================================================================
-- WORKSPACE SCOPING
-- ============================================================================

-- User-workspace relationships
ALTER TABLE workspace_members
ADD CONSTRAINT fk_workspace_members_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_members
ADD CONSTRAINT fk_workspace_members_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ============================================================================
-- AUTH TABLES
-- ============================================================================

ALTER TABLE user_passwords
ADD CONSTRAINT fk_user_passwords_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE oauth_accounts
ADD CONSTRAINT fk_oauth_accounts_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sessions
ADD CONSTRAINT fk_sessions_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE login_attempts
ADD CONSTRAINT fk_login_attempts_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- PROFILE & RESUME TABLES
-- ============================================================================

-- Profiles belong to workspaces
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Work experiences belong to profiles
ALTER TABLE work_experiences
ADD CONSTRAINT fk_work_experiences_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Education entries belong to profiles
ALTER TABLE education_entries
ADD CONSTRAINT fk_education_entries_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Resume variants belong to profiles
ALTER TABLE resume_variants
ADD CONSTRAINT fk_resume_variants_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Version snapshots belong to variants
ALTER TABLE version_snapshots
ADD CONSTRAINT fk_version_snapshots_variant
FOREIGN KEY (variant_id) REFERENCES resume_variants(id) ON DELETE CASCADE;

-- Redaction rules belong to variants
ALTER TABLE redaction_rules
ADD CONSTRAINT fk_redaction_rules_variant
FOREIGN KEY (variant_id) REFERENCES resume_variants(id) ON DELETE CASCADE;

-- Public share links belong to variants
ALTER TABLE public_share_links
ADD CONSTRAINT fk_public_share_links_variant
FOREIGN KEY (variant_id) REFERENCES resume_variants(id) ON DELETE CASCADE;

-- Quality analyses belong to variants
ALTER TABLE quality_analyses
ADD CONSTRAINT fk_quality_analyses_variant
FOREIGN KEY (variant_id) REFERENCES resume_variants(id) ON DELETE CASCADE;

-- ============================================================================
-- IMPORT & PROVENANCE TABLES
-- ============================================================================

-- Import sessions belong to workspaces
ALTER TABLE import_sessions
ADD CONSTRAINT fk_import_sessions_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Staging records belong to import sessions
ALTER TABLE staging_records
ADD CONSTRAINT fk_staging_records_session
FOREIGN KEY (session_id) REFERENCES import_sessions(id) ON DELETE CASCADE;

-- Source artifacts belong to workspaces
ALTER TABLE source_artifacts
ADD CONSTRAINT fk_source_artifacts_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Provenance links to source artifacts (RESTRICT to prevent orphaned links)
ALTER TABLE provenance_links
ADD CONSTRAINT fk_provenance_links_artifact
FOREIGN KEY (source_artifact_id) REFERENCES source_artifacts(id) ON DELETE RESTRICT;

-- Change log entries belong to workspaces
ALTER TABLE change_log_entries
ADD CONSTRAINT fk_change_log_entries_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ============================================================================
-- CAREER ENTITY TABLES (CMOS)
-- ============================================================================

-- Jobs with workspace scoping
ALTER TABLE jobs
ADD CONSTRAINT fk_jobs_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Jobs optional institution link
ALTER TABLE jobs
ADD CONSTRAINT fk_jobs_institution
FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

-- People with workspace scoping
ALTER TABLE people
ADD CONSTRAINT fk_people_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- People optional institution link
ALTER TABLE people
ADD CONSTRAINT fk_people_institution
FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

-- Interactions with workspace scoping
ALTER TABLE interactions
ADD CONSTRAINT fk_interactions_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Interactions optional person link
ALTER TABLE interactions
ADD CONSTRAINT fk_interactions_person
FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL;

-- Relationships (junction table)
ALTER TABLE relationships
ADD CONSTRAINT fk_relationships_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE relationships
ADD CONSTRAINT fk_relationships_person
FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE;

-- Goals with workspace scoping
ALTER TABLE goals
ADD CONSTRAINT fk_goals_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Skills with workspace and optional profile link
ALTER TABLE skills
ADD CONSTRAINT fk_skills_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE skills
ADD CONSTRAINT fk_skills_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Projects with workspace and optional profile link
ALTER TABLE projects
ADD CONSTRAINT fk_projects_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE projects
ADD CONSTRAINT fk_projects_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Events with workspace scoping
ALTER TABLE events
ADD CONSTRAINT fk_events_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Institutions with workspace scoping
ALTER TABLE institutions
ADD CONSTRAINT fk_institutions_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Learning with workspace scoping
ALTER TABLE learning
ADD CONSTRAINT fk_learning_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE learning
ADD CONSTRAINT fk_learning_institution
FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;

-- Content with workspace scoping
ALTER TABLE content
ADD CONSTRAINT fk_content_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Feedback with workspace scoping
ALTER TABLE feedback
ADD CONSTRAINT fk_feedback_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE feedback
ADD CONSTRAINT fk_feedback_person
FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL;

-- Achievements with workspace scoping
ALTER TABLE achievements
ADD CONSTRAINT fk_achievements_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Compensation with workspace scoping
ALTER TABLE compensation
ADD CONSTRAINT fk_compensation_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE compensation
ADD CONSTRAINT fk_compensation_job
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Workspace-scoped queries
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_jobs_workspace ON jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_people_workspace ON people(workspace_id);
CREATE INDEX IF NOT EXISTS idx_skills_workspace ON skills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_events_workspace ON events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_interactions_workspace ON interactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_workspace ON goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_learning_workspace ON learning(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_workspace ON content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_feedback_workspace ON feedback(workspace_id);
CREATE INDEX IF NOT EXISTS idx_achievements_workspace ON achievements(workspace_id);

-- Profile-scoped resume queries
CREATE INDEX IF NOT EXISTS idx_work_experiences_profile ON work_experiences(profile_id);
CREATE INDEX IF NOT EXISTS idx_education_entries_profile ON education_entries(profile_id);
CREATE INDEX IF NOT EXISTS idx_resume_variants_profile ON resume_variants(profile_id);
CREATE INDEX IF NOT EXISTS idx_version_snapshots_variant ON version_snapshots(variant_id);

-- Import tracking
CREATE INDEX IF NOT EXISTS idx_staging_records_session ON staging_records(session_id);
CREATE INDEX IF NOT EXISTS idx_staging_records_status ON staging_records(session_id, decision);

-- Provenance lookups
CREATE INDEX IF NOT EXISTS idx_provenance_links_artifact ON provenance_links(source_artifact_id);
CREATE INDEX IF NOT EXISTS idx_provenance_links_target ON provenance_links(target_table, target_id);

-- Share links by token (for public access)
CREATE INDEX IF NOT EXISTS idx_public_share_links_token ON public_share_links(token);
CREATE INDEX IF NOT EXISTS idx_public_share_links_active ON public_share_links(variant_id) WHERE is_active = true;
