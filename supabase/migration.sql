-- ====================================================
-- AI File Manager — Database Schema Migration
-- Run this SQL in your Supabase SQL Editor
-- ====================================================

-- Categories for AI file types
create table if not exists ai_categories (
  id bigint generated always as identity primary key,
  slug text unique not null,
  label text not null,
  icon text not null default 'file',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Seed default categories
insert into ai_categories (slug, label, icon, sort_order) values
  ('skills',    'Skills',     'zap',       1),
  ('subagents', 'Subagents',  'bot',       2),
  ('rules',     'Rules',      'shield',    3),
  ('commands',  'Commands',   'terminal',  4),
  ('markdown',  'Markdown',   'file-text', 5),
  ('html',      'HTML',       'code',      6)
on conflict (slug) do nothing;

-- Main files table
create table if not exists ai_files (
  id bigint generated always as identity primary key,
  category_id bigint not null references ai_categories(id),
  title text not null,
  file_name text not null,
  source_path text not null,
  content text,
  file_type text not null default 'markdown'
    check (file_type in ('markdown', 'html', 'yaml', 'json', 'text')),
  file_size bigint not null default 0,
  tags text[] default '{}',
  metadata jsonb default '{}',
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Performance indexes (partial to exclude soft-deleted)
create index if not exists idx_ai_files_category
  on ai_files(category_id) where not is_deleted;

create index if not exists idx_ai_files_type
  on ai_files(file_type) where not is_deleted;

-- Unique constraint for upsert in sync
create unique index if not exists idx_ai_files_source_path_unique
  on ai_files(source_path);

-- Full-text search index
create index if not exists idx_ai_files_search
  on ai_files using gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(file_name, '')));

-- Auto-update updated_at on row change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ai_files_updated_at on ai_files;
create trigger ai_files_updated_at
  before update on ai_files
  for each row
  execute function update_updated_at_column();

-- ====================================================
-- Installed Skills table (skills.sh integration)
-- ====================================================

create table if not exists installed_skills (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  repo_url text not null unique,
  repo_owner text not null,
  repo_name text not null,
  skill_path text not null,
  installed_version text,
  latest_version text,
  has_update boolean default false,
  skill_content text,
  default_branch text,
  installed_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migration: add default_branch if upgrading from previous schema
ALTER TABLE installed_skills ADD COLUMN IF NOT EXISTS default_branch text;
ALTER TABLE installed_skills ALTER COLUMN default_branch DROP DEFAULT;

create index if not exists idx_installed_skills_repo
  on installed_skills(repo_owner, repo_name);

drop trigger if exists installed_skills_updated_at on installed_skills;
create trigger installed_skills_updated_at
  before update on installed_skills
  for each row
  execute function update_updated_at_column();

-- ====================================================
-- Row Level Security
-- ====================================================

alter table ai_files enable row level security;
alter table ai_categories enable row level security;
alter table installed_skills enable row level security;

-- Public read access (files are a shared resource)
create policy "Files are publicly readable"
  on ai_files for select
  to anon, authenticated
  using (not is_deleted);

create policy "Categories are publicly readable"
  on ai_categories for select
  to anon, authenticated
  using (true);

create policy "Skills are publicly readable"
  on installed_skills for select
  to anon, authenticated
  using (true);

-- Write access via publishable key (for self-hosted admin usage)
create policy "Allow insert files"
  on ai_files for insert
  to anon, authenticated
  with check (true);

create policy "Allow update files"
  on ai_files for update
  to anon, authenticated
  using (true);

create policy "Allow delete files"
  on ai_files for delete
  to anon, authenticated
  using (true);

create policy "Allow insert skills"
  on installed_skills for insert
  to anon, authenticated
  with check (true);

create policy "Allow update skills"
  on installed_skills for update
  to anon, authenticated
  using (true);

create policy "Allow delete skills"
  on installed_skills for delete
  to anon, authenticated
  using (true);
