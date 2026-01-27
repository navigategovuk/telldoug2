-- TellDoug Initial Schema
-- Generated from helpers/schema.tsx
-- Creates all tables for the unified Career Management + Resume system

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE achievement_category AS ENUM ('award', 'certification', 'milestone', 'promotion', 'recognition');
CREATE TYPE content_type AS ENUM ('article', 'media_mention', 'post', 'publication', 'speaking');
CREATE TYPE entity_type AS ENUM ('event', 'institution', 'job', 'person', 'project', 'skill');
CREATE TYPE event_type AS ENUM ('conference', 'interview', 'meeting', 'networking', 'other', 'presentation', 'workshop');
CREATE TYPE feedback_type AS ENUM ('360_feedback', 'career_coach', 'one_on_one', 'peer_feedback', 'performance_review');
CREATE TYPE goal_status AS ENUM ('abandoned', 'completed', 'in_progress', 'not_started');
CREATE TYPE goal_type AS ENUM ('career', 'financial', 'relationship', 'skill');
CREATE TYPE institution_type AS ENUM ('bootcamp', 'college', 'organization', 'other', 'school', 'university');
CREATE TYPE interaction_type AS ENUM ('call', 'coffee', 'email', 'meeting');
CREATE TYPE learning_status AS ENUM ('abandoned', 'completed', 'in_progress', 'planned');
CREATE TYPE learning_type AS ENUM ('certification', 'conference', 'course', 'degree', 'workshop');
CREATE TYPE project_status AS ENUM ('cancelled', 'completed', 'in_progress', 'on_hold', 'planning');
CREATE TYPE skill_proficiency AS ENUM ('advanced', 'beginner', 'expert', 'intermediate');
CREATE TYPE import_status AS ENUM ('committed', 'mapped', 'merged', 'pending', 'skipped');
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'user');

-- ============================================================================
-- AUTH & WORKSPACE TABLES
-- ============================================================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_passwords (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

CREATE TABLE oauth_states (
  id SERIAL PRIMARY KEY,
  state VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,
  code_verifier VARCHAR(255) NOT NULL,
  redirect_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspaces (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  invited_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- PROFILE & RESUME TABLES
-- ============================================================================

CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  label VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  url TEXT,
  summary TEXT,
  location JSONB,
  social_profiles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE work_experiences (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id VARCHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  employment_type VARCHAR(50),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  summary TEXT,
  highlights JSONB,
  url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE education_entries (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id VARCHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  study_type VARCHAR(100),
  degree_type VARCHAR(100),
  area VARCHAR(255),
  minor VARCHAR(255),
  score VARCHAR(50),
  courses JSONB,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resume_variants (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  profile_id VARCHAR(36) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_role VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  view_definition_id VARCHAR(36),
  compiled_data JSONB,
  compiled_at TIMESTAMPTZ,
  canonical_data_hash VARCHAR(64),
  last_canonical_change TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE version_snapshots (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  resume_variant_id VARCHAR(36) NOT NULL REFERENCES resume_variants(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  label VARCHAR(255),
  notes TEXT,
  data_hash VARCHAR(64),
  canonical_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE view_definitions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  view_type VARCHAR(50),
  rules JSONB NOT NULL DEFAULT '{}',
  redactions JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public_share_links (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  resume_variant_id VARCHAR(36) NOT NULL REFERENCES resume_variants(id) ON DELETE CASCADE,
  snapshot_id VARCHAR(36) REFERENCES version_snapshots(id),
  token VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(255),
  password_hash VARCHAR(255),
  is_live BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quality_analyses (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  resume_variant_id VARCHAR(36) NOT NULL REFERENCES resume_variants(id) ON DELETE CASCADE,
  snapshot_id VARCHAR(36) REFERENCES version_snapshots(id),
  score INTEGER NOT NULL,
  checklist JSONB NOT NULL DEFAULT '[]',
  warnings JSONB NOT NULL DEFAULT '[]',
  data_hash VARCHAR(64) NOT NULL,
  is_stale BOOLEAN DEFAULT FALSE,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- IMPORT & PROVENANCE TABLES
-- ============================================================================

CREATE TABLE source_artifacts (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  file_size_bytes INTEGER,
  file_hash VARCHAR(64),
  label VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE import_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_artifact_id VARCHAR(36) REFERENCES source_artifacts(id),
  source_type VARCHAR(50) NOT NULL DEFAULT 'unknown',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE staging_records (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  import_session_id VARCHAR(36) NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL,
  source_data JSONB NOT NULL,
  mapped_data JSONB,
  field_mappings JSONB DEFAULT '{}',
  status import_status DEFAULT 'pending',
  duplicate_of_id VARCHAR(36),
  merge_suggestion JSONB,
  user_decision VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provenance_links (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_table VARCHAR(100) NOT NULL,
  target_id VARCHAR(36) NOT NULL,
  target_field VARCHAR(100),
  source_type VARCHAR(50) NOT NULL,
  source_artifact_id VARCHAR(36) REFERENCES source_artifacts(id),
  source_date TIMESTAMPTZ,
  confidence VARCHAR(20) DEFAULT 'high',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE change_log_entries (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_table VARCHAR(100) NOT NULL,
  target_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  before_data JSONB,
  after_data JSONB,
  changed_by VARCHAR(36),
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CAREER MANAGEMENT (CMOS) TABLES
-- ============================================================================

CREATE TABLE achievements (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category achievement_category NOT NULL,
  achieved_date TIMESTAMPTZ NOT NULL,
  quantifiable_impact TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE jobs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  highlights JSONB,
  summary TEXT,
  department VARCHAR(255),
  employment_type VARCHAR(50),
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE compensation (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  effective_date TIMESTAMPTZ NOT NULL,
  base_salary NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  bonus NUMERIC(12,2),
  equity_value NUMERIC(12,2),
  benefits_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE content (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content_type content_type NOT NULL DEFAULT 'article',
  description TEXT,
  url TEXT,
  platform VARCHAR(100),
  publication_date TIMESTAMPTZ NOT NULL,
  engagement_metrics TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  event_type event_type NOT NULL DEFAULT 'meeting',
  description TEXT,
  location VARCHAR(255),
  event_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE people (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(255),
  relationship_type VARCHAR(50) DEFAULT 'professional',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  person_id VARCHAR(36) NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  feedback_type feedback_type NOT NULL,
  feedback_date TIMESTAMPTZ NOT NULL,
  notes TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE goals (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  goal_type goal_type NOT NULL,
  status goal_status NOT NULL DEFAULT 'not_started',
  target_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE institutions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type institution_type NOT NULL DEFAULT 'university',
  location VARCHAR(255),
  degree VARCHAR(255),
  field_of_study VARCHAR(255),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  person_id VARCHAR(36) NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  project_id VARCHAR(36),
  interaction_type interaction_type NOT NULL,
  interaction_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE learning (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  learning_type learning_type NOT NULL DEFAULT 'course',
  provider VARCHAR(255),
  status learning_status NOT NULL DEFAULT 'planned',
  start_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  cost NUMERIC(10,2),
  skills_gained TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  profile_id VARCHAR(36) REFERENCES profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  highlights JSONB,
  keywords JSONB,
  url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skills (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  profile_id VARCHAR(36) REFERENCES profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  proficiency skill_proficiency NOT NULL DEFAULT 'intermediate',
  level VARCHAR(50),
  keywords JSONB,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE relationships (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type entity_type NOT NULL,
  source_id VARCHAR(36) NOT NULL,
  target_type entity_type NOT NULL,
  target_id VARCHAR(36) NOT NULL,
  relationship_label VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_profiles_workspace_id ON profiles(workspace_id);
CREATE INDEX idx_work_experiences_profile_id ON work_experiences(profile_id);
CREATE INDEX idx_education_entries_profile_id ON education_entries(profile_id);
CREATE INDEX idx_resume_variants_workspace_id ON resume_variants(workspace_id);
CREATE INDEX idx_resume_variants_profile_id ON resume_variants(profile_id);
CREATE INDEX idx_version_snapshots_variant_id ON version_snapshots(resume_variant_id);
CREATE INDEX idx_public_share_links_token ON public_share_links(token);
CREATE INDEX idx_import_sessions_workspace_id ON import_sessions(workspace_id);
CREATE INDEX idx_staging_records_session_id ON staging_records(import_session_id);
CREATE INDEX idx_staging_records_status ON staging_records(status);
CREATE INDEX idx_achievements_workspace_id ON achievements(workspace_id);
CREATE INDEX idx_jobs_workspace_id ON jobs(workspace_id);
CREATE INDEX idx_skills_workspace_id ON skills(workspace_id);
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_people_workspace_id ON people(workspace_id);
CREATE INDEX idx_learning_workspace_id ON learning(workspace_id);
CREATE INDEX idx_content_workspace_id ON content(workspace_id);
CREATE INDEX idx_goals_workspace_id ON goals(workspace_id);
CREATE INDEX idx_feedback_person_id ON feedback(person_id);
CREATE INDEX idx_interactions_person_id ON interactions(person_id);
CREATE INDEX idx_compensation_job_id ON compensation(job_id);
