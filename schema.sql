-- ═══════════════════════════════════════════════════
-- KCET Compass — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- COLLEGES
create table if not exists colleges (
  id serial primary key,
  code varchar(10) unique not null,
  name text not null,
  short_name text,
  district text not null,
  taluk text,
  type text check (type in ('government','aided','private')) not null,
  naac_grade text,
  established_year int,
  address text,
  website text,
  latitude float,
  longitude float,
  created_at timestamptz default now()
);

-- BRANCHES
create table if not exists branches (
  id serial primary key,
  code varchar(10) unique not null,
  name text not null,
  short_name text,
  stream text check (stream in ('engineering','pharmacy','agriculture','architecture')) not null
);

-- COLLEGE_BRANCHES
create table if not exists college_branches (
  id serial primary key,
  college_id int references colleges(id),
  branch_id int references branches(id),
  total_seats int,
  unique(college_id, branch_id)
);

-- CUTOFFS
create table if not exists cutoffs (
  id serial primary key,
  college_id int references colleges(id),
  branch_id int references branches(id),
  year int not null,
  round int not null check (round in (1,2,3)),
  vertical_category text not null,
  horizontal_flags text[] default '{}',
  opening_rank int,
  closing_rank int not null,
  unique(college_id, branch_id, year, round, vertical_category, horizontal_flags)
);

-- MARKS_RANK_MAP
create table if not exists marks_rank_map (
  id serial primary key,
  year int not null,
  kcet_marks float not null,
  pu_percentage float,
  rank_min int not null,
  rank_max int not null,
  unique(year, kcet_marks)
);

-- SPECIAL_QUOTA_SEATS
create table if not exists special_quota_seats (
  id serial primary key,
  college_id int references colleges(id),
  quota_type text check (quota_type in
    ('ncc','sports','pwd','scouts_guides',
     'defence','ex_defence','capf','jk_migrant',
     'anglo_indian','hk_region')) not null,
  branch_id int references branches(id),
  seats_available int,
  year int not null,
  notes text
);

-- SEARCH_LOGS
create table if not exists search_logs (
  id serial primary key,
  session_id text,
  rank_input int,
  vertical_category text,
  horizontal_flags text[],
  preferred_branches text[],
  preferred_districts text[],
  result_count int,
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_cutoffs_year on cutoffs(year);
create index if not exists idx_cutoffs_college on cutoffs(college_id);
create index if not exists idx_cutoffs_category on cutoffs(vertical_category);
create index if not exists idx_cutoffs_closing on cutoffs(closing_rank);
