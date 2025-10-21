create extension if not exists pgcrypto;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text,
  minutes     int,
  image_url   text,
  is_trending boolean default false,
  created_at  timestamptz default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  badge      text,
  title      text not null,
  meta       text,
  image_url  text,
  score      numeric default 0,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title      text not null,
  location   text,
  type       text check (type in ('Full','Part','Remote')),
  deadline   date,
  featured   boolean default false,
  created_at timestamptz default now()
);

create table if not exists contests (
  id uuid primary key default gen_random_uuid(),
  org        text not null,
  role       text,
  uf         text,
  deadline   date,
  featured   boolean default false,
  created_at timestamptz default now()
);

create table if not exists guides (
  id uuid primary key default gen_random_uuid(),
  title      text not null,
  category   text,
  minutes    int,
  image_url  text,
  created_at timestamptz default now()
);

drop view if exists trending_posts;
create view trending_posts as
  select * from posts
  where is_trending = true
  order by created_at desc
  limit 12;

alter table posts    enable row level security;
alter table cards    enable row level security;
alter table jobs     enable row level security;
alter table contests enable row level security;
alter table guides   enable row level security;

drop policy if exists read_public_posts    on posts;
drop policy if exists write_dev_posts      on posts;
drop policy if exists update_dev_posts     on posts;
drop policy if exists delete_dev_posts     on posts;

drop policy if exists read_public_cards    on cards;
drop policy if exists write_dev_cards      on cards;
drop policy if exists update_dev_cards     on cards;
drop policy if exists delete_dev_cards     on cards;

drop policy if exists read_public_jobs     on jobs;
drop policy if exists write_dev_jobs       on jobs;
drop policy if exists update_dev_jobs      on jobs;
drop policy if exists delete_dev_jobs      on jobs;

drop policy if exists read_public_contests on contests;
drop policy if exists write_dev_contests   on contests;
drop policy if exists update_dev_contests  on contests;
drop policy if exists delete_dev_contests  on contests;

drop policy if exists read_public_guides   on guides;
drop policy if exists write_dev_guides     on guides;
drop policy if exists update_dev_guides    on guides;
drop policy if exists delete_dev_guides    on guides;

create policy read_public_posts    on posts    for select using (true);
create policy read_public_cards    on cards    for select using (true);
create policy read_public_jobs     on jobs     for select using (true);
create policy read_public_contests on contests for select using (true);
create policy read_public_guides   on guides   for select using (true);

-- DEV: permite escrita com anon para testar rapidamente (REMOVER EM PRODUÇÃO)
create policy write_dev_posts    on posts    for insert with check (auth.role() in ('anon','authenticated'));
create policy update_dev_posts   on posts    for update using     (auth.role() in ('anon','authenticated'));
create policy delete_dev_posts   on posts    for delete using     (auth.role() in ('anon','authenticated'));

create policy write_dev_cards    on cards    for insert with check (auth.role() in ('anon','authenticated'));
create policy update_dev_cards   on cards    for update using     (auth.role() in ('anon','authenticated'));
create policy delete_dev_cards   on cards    for delete using     (auth.role() in ('anon','authenticated'));

create policy write_dev_jobs     on jobs     for insert with check (auth.role() in ('anon','authenticated'));
create policy update_dev_jobs    on jobs     for update using     (auth.role() in ('anon','authenticated'));
create policy delete_dev_jobs    on jobs     for delete using     (auth.role() in ('anon','authenticated'));

create policy write_dev_contests on contests for insert with check (auth.role() in ('anon','authenticated'));
create policy update_dev_contests on contests for update using     (auth.role() in ('anon','authenticated'));
create policy delete_dev_contests on contests for delete using     (auth.role() in ('anon','authenticated'));

create policy write_dev_guides   on guides   for insert with check (auth.role() in ('anon','authenticated'));
create policy update_dev_guides  on guides   for update using     (auth.role() in ('anon','authenticated'));
create policy delete_dev_guides  on guides   for delete using     (auth.role() in ('anon','authenticated'));


-- ADS CONFIG STORAGE
create table if not exists public.ads_config (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);

-- seed default row if not exists
insert into public.ads_config(id, data)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
