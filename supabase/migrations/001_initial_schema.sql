-- Helper App — initial schema
-- Run this in your Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

-- ──────────────────────────────────────────────────────────────────────────────
-- Seniors
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists seniors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  age          integer,
  city         text,
  health_notes text,
  interests    text[],
  created_at   timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Caregivers
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists caregivers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  relationship     text,
  senior_id        uuid references seniors(id) on delete cascade,
  emergency_name   text,
  emergency_phone  text,
  created_at       timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Alerts  (scam/financial/health)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  senior_id   uuid references seniors(id) on delete cascade,
  type        text not null check (type in ('high','medium','low')),
  category    text not null check (category in ('scam','financial','health','activity')),
  title       text not null,
  msg         text not null,
  icon        text,
  resolved    boolean default false,
  created_at  timestamptz default now()
);

create index if not exists alerts_senior_idx  on alerts(senior_id);
create index if not exists alerts_created_idx on alerts(created_at desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- Conversations  (one per session with Helper)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  senior_id  uuid references seniors(id) on delete cascade,
  started_at timestamptz default now(),
  ended_at   timestamptz,
  mood       text,
  summary    text
);

create index if not exists conversations_senior_idx on conversations(senior_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Messages  (individual turns within a conversation)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant')),
  content         text not null,
  created_at      timestamptz default now()
);

create index if not exists messages_conv_idx on messages(conversation_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Medications
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists medications (
  id          uuid primary key default gen_random_uuid(),
  senior_id   uuid references seniors(id) on delete cascade,
  name        text not null,
  dose        text,
  schedule    text,           -- e.g. 'Morning, Evening'
  taken_today boolean default false,
  last_taken  timestamptz,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Wellness scores  (daily snapshot)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists wellness_scores (
  id          uuid primary key default gen_random_uuid(),
  senior_id   uuid references seniors(id) on delete cascade,
  date        date not null default current_date,
  overall     integer check (overall between 0 and 100),
  mood        integer check (mood between 0 and 100),
  activity    integer check (activity between 0 and 100),
  social      integer check (social between 0 and 100),
  notes       text,
  unique(senior_id, date)
);

create index if not exists wellness_senior_idx on wellness_scores(senior_id, date desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- Handoffs  (nightly caregiver summaries)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists handoffs (
  id          uuid primary key default gen_random_uuid(),
  senior_id   uuid references seniors(id) on delete cascade,
  date        date not null default current_date,
  headline    text,
  body        text not null,
  mood_emoji  text,
  sent_at     timestamptz,
  unique(senior_id, date)
);

create index if not exists handoffs_senior_idx on handoffs(senior_id, date desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- Enable Row Level Security (lock down by default; open up per-route as needed)
-- ──────────────────────────────────────────────────────────────────────────────
alter table seniors         enable row level security;
alter table caregivers      enable row level security;
alter table alerts          enable row level security;
alter table conversations   enable row level security;
alter table messages        enable row level security;
alter table medications     enable row level security;
alter table wellness_scores enable row level security;
alter table handoffs        enable row level security;

-- Service-role key (used by the Express server only) bypasses RLS automatically.
-- For each table, allow the service role full access:
create policy "service role full access" on seniors         for all using (true) with check (true);
create policy "service role full access" on caregivers      for all using (true) with check (true);
create policy "service role full access" on alerts          for all using (true) with check (true);
create policy "service role full access" on conversations   for all using (true) with check (true);
create policy "service role full access" on messages        for all using (true) with check (true);
create policy "service role full access" on medications     for all using (true) with check (true);
create policy "service role full access" on wellness_scores for all using (true) with check (true);
create policy "service role full access" on handoffs        for all using (true) with check (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- Seed: demo senior + caregiver (matches Setup.jsx defaults)
-- ──────────────────────────────────────────────────────────────────────────────
insert into seniors (id, name, age, city, interests) values
  ('00000000-0000-0000-0000-000000000001', 'Margaret', 78, 'Montclair, NJ',
   array['Gardening','Reading','Grandchildren','Crosswords'])
on conflict do nothing;

insert into caregivers (id, name, relationship, senior_id) values
  ('00000000-0000-0000-0000-000000000002', 'Sarah', 'Daughter',
   '00000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into medications (senior_id, name, dose, schedule, taken_today) values
  ('00000000-0000-0000-0000-000000000001', 'Lisinopril',   '10mg', 'Morning',          true),
  ('00000000-0000-0000-0000-000000000001', 'Metformin',    '500mg','Morning, Evening',  false),
  ('00000000-0000-0000-0000-000000000001', 'Atorvastatin', '20mg', 'Evening',           false)
on conflict do nothing;

insert into wellness_scores (senior_id, overall, mood, activity, social) values
  ('00000000-0000-0000-0000-000000000001', 82, 85, 70, 90)
on conflict do nothing;

insert into handoffs (senior_id, headline, body, mood_emoji) values
  ('00000000-0000-0000-0000-000000000001',
   'A good day overall',
   'Margaret had a relaxed morning — chatted about her garden and asked about the grandchildren. She mentioned some knee pain around noon but seemed comfortable by the afternoon. Took her morning Lisinopril. Evening Metformin was missed. Mood was warm and engaged throughout.',
   '😊')
on conflict do nothing;

insert into alerts (senior_id, type, category, title, msg, icon) values
  ('00000000-0000-0000-0000-000000000001', 'high',   'scam',      'Scam Call Blocked',     'Blocked call impersonating Medicare. Your parent was not charged.',  '🛡️'),
  ('00000000-0000-0000-0000-000000000001', 'medium', 'financial', 'Unusual Transaction',   '$450 wire transfer flagged — awaiting your review.',                '💳')
on conflict do nothing;
