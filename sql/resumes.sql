create table resumes (id uuid primary key default gen_random_uuid(), name text, email text, created_at timestamp default now());
