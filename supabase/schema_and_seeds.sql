-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Optional extras for posts
alter table posts add column if not exists status text default 'Rascunho';
alter table posts add column if not exists type text;
alter table posts add column if not exists extras jsonb default '{}'::jsonb;
alter table posts add column if not exists gallery jsonb default '[]'::jsonb;
alter table posts add column if not exists sources jsonb default '[]'::jsonb;

-- Sample category
insert into categories (name, description) values ('Concursos', 'Concursos públicos e seleções') on conflict (name) do nothing;

-- Sample quiz
insert into quizzes (title, slug, category, questions)
values (
  'Teste de Finanças Pessoais',
  'financas-basico',
  'Educação Financeira',
  '[{"text":"Quanto é 10% de 200?","options":["10","20","30","40"],"correct":1},{"text":"Reserva de emergência ideal?","options":["1 mês","3-6 meses","12 meses","24 meses"],"correct":1}]'
) on conflict (slug) do nothing;
