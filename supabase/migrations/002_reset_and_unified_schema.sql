-- Reset-first migration for development environments with no data.
-- This migration intentionally replaces legacy schemas (ai_* and old files/folders variants).

create extension if not exists pgcrypto;

-- Drop legacy views/tables if they exist.
drop table if exists file_change_logs cascade;
drop table if exists file_access_logs cascade;
drop table if exists file_tag_relations cascade;
drop table if exists file_tags cascade;
drop table if exists files cascade;
drop table if exists folders cascade;
drop table if exists ai_files cascade;
drop table if exists ai_categories cascade;

create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references folders(id) on delete cascade,
  path text not null default '',
  level integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(parent_id, name)
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete set null,
  title text not null,
  file_name text not null,
  source_path text not null unique,
  file_type text not null check (file_type in ('markdown', 'html', 'yaml', 'json', 'text')),
  content text,
  size bigint not null default 0,
  public_path text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  sensitivity_level text not null default 'internal' check (sensitivity_level in ('public', 'internal', 'restricted')),
  owner_id uuid,
  workspace_id uuid,
  deleted_at timestamptz,
  content_hash text,
  signature text,
  signature_algo text,
  signature_key_id text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists file_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text default '#6366f1',
  created_at timestamptz not null default now()
);

create table if not exists file_tag_relations (
  file_id uuid not null references files(id) on delete cascade,
  tag_id uuid not null references file_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (file_id, tag_id)
);

create table if not exists file_access_logs (
  id bigint generated always as identity primary key,
  file_id uuid references files(id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists file_change_logs (
  id bigint generated always as identity primary key,
  file_id uuid references files(id) on delete set null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_folders_parent_id on folders(parent_id);
create unique index if not exists idx_folders_path_unique on folders(path);
create index if not exists idx_files_folder_id on files(folder_id);
create index if not exists idx_files_type_active on files(file_type) where is_active = true;
create index if not exists idx_files_source_path on files(source_path);
create index if not exists idx_files_sensitivity on files(sensitivity_level);
create index if not exists idx_files_deleted_at on files(deleted_at);
create index if not exists idx_file_access_logs_file_id_created on file_access_logs(file_id, created_at desc);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function update_folder_path()
returns trigger as $$
begin
  if new.parent_id is null then
    new.path := new.name;
    new.level := 0;
  else
    select path || '/' || new.name, level + 1
    into new.path, new.level
    from folders
    where id = new.parent_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_folders_updated_at on folders;
create trigger update_folders_updated_at
before update on folders
for each row execute function update_updated_at_column();

drop trigger if exists update_files_updated_at on files;
create trigger update_files_updated_at
before update on files
for each row execute function update_updated_at_column();

drop trigger if exists update_folder_path_trigger on folders;
create trigger update_folder_path_trigger
before insert or update on folders
for each row execute function update_folder_path();

-- Seed root folders.
insert into folders (name, parent_id, sort_order)
values
  ('skills', null, 1),
  ('subagents', null, 2),
  ('rules', null, 3),
  ('commands', null, 4),
  ('docs', null, 5),
  ('projects', null, 6)
on conflict do nothing;

-- Keep installed_skills table from legacy migration for compatibility.
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

drop trigger if exists installed_skills_updated_at on installed_skills;
create trigger installed_skills_updated_at
before update on installed_skills
for each row execute function update_updated_at_column();

-- RLS defaults: deny-by-default, then explicit policies.
alter table folders enable row level security;
alter table files enable row level security;
alter table file_tags enable row level security;
alter table file_tag_relations enable row level security;
alter table file_access_logs enable row level security;
alter table file_change_logs enable row level security;
alter table installed_skills enable row level security;

create policy "folders_read" on folders for select to anon, authenticated using (true);
create policy "files_read_active" on files for select to anon, authenticated using (is_active = true);
create policy "files_write_service" on files for all to authenticated using (true) with check (true);
create policy "folders_write_service" on folders for all to authenticated using (true) with check (true);
create policy "tags_read" on file_tags for select to anon, authenticated using (true);
create policy "tags_write" on file_tags for all to authenticated using (true) with check (true);
create policy "file_tags_rel_read" on file_tag_relations for select to anon, authenticated using (true);
create policy "file_tags_rel_write" on file_tag_relations for all to authenticated using (true) with check (true);
create policy "access_logs_write" on file_access_logs for insert to authenticated with check (true);
create policy "change_logs_write" on file_change_logs for insert to authenticated with check (true);
create policy "skills_read" on installed_skills for select to anon, authenticated using (true);
create policy "skills_write" on installed_skills for all to authenticated using (true) with check (true);
