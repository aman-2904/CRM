-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES TABLE
create table public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text
);

-- PROFILES TABLE (Extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id),
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LEADS TABLE
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  assigned_to uuid references public.profiles(id),
  status text check (status in ('new', 'contacted', 'interested', 'converted', 'lost')) default 'new',
  first_name text not null,
  last_name text,
  email text,
  phone text,
  company text,
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DEALS TABLE
create table public.deals (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  name text,
  amount numeric default 0,
  stage text check (stage in ('prospecting', 'negotiation', 'closed_won', 'closed_lost')) default 'prospecting',
  expected_close_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FOLLOWUPS TABLE
create table public.followups (
  id uuid primary key default uuid_generate_v4(),
  assigned_to uuid references public.profiles(id),
  lead_id uuid references public.leads(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text check (status in ('pending', 'completed', 'missed', 'cancelled')) default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ACTIVITIES TABLE
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  lead_id uuid references public.leads(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  type text check (type in ('call', 'email', 'meeting', 'note', 'log')) not null,
  description text,
  created_at timestamptz default now()
);

-- INDEXES
create index idx_profiles_role_id on public.profiles(role_id);
create index idx_leads_assigned_to on public.leads(assigned_to);
create index idx_leads_status on public.leads(status);
create index idx_deals_lead_id on public.deals(lead_id);
create index idx_deals_owner_id on public.deals(owner_id);
create index idx_deals_stage on public.deals(stage);
create index idx_followups_assigned_to on public.followups(assigned_to);
create index idx_followups_scheduled_at on public.followups(scheduled_at);
create index idx_activities_user_id on public.activities(user_id);
create index idx_activities_lead_id on public.activities(lead_id);
create index idx_activities_deal_id on public.activities(deal_id);

-- UPDATED_AT TRIGGER FUNCTION
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- TRIGGERS FOR UPDATED_AT
create trigger on_profiles_updated before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_leads_updated before update on public.leads
  for each row execute procedure public.handle_updated_at();

create trigger on_deals_updated before update on public.deals
  for each row execute procedure public.handle_updated_at();

create trigger on_followups_updated before update on public.followups
  for each row execute procedure public.handle_updated_at();

-- HANDLE NEW USER (Triggers on auth.users content)
-- Note: You must manually insert roles 'admin' and 'employee' first!
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role_id uuid;
begin
  select id into default_role_id from public.roles where name = 'employee';
  
  insert into public.profiles (id, role_id, full_name, email, avatar_url)
  values (
    new.id,
    default_role_id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
