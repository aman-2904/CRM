-- CLEANUP AND DISABLE RLS FOR DEV
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Employees can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Employees can create leads" ON public.leads;

-- Enable RLS on all tables
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.deals enable row level security;
alter table public.followups enable row level security;
alter table public.activities enable row level security;

-- HELPER FUNCTION: Check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles p
    join public.roles r on p.role_id = r.id
    where p.id = auth.uid() and r.name = 'admin'
  );
end;
$$ language plpgsql security definer;

-- POLICIES

-- 1. Roles
-- Everyone can read roles
create policy "Roles are viewable by everyone" on public.roles
  for select using (true);

-- Only admins can modify roles (though usually static)
create policy "Admins can manage roles" on public.roles
  for all using (public.is_admin());

-- 2. Profiles
-- Everyone can read profiles (basic info is often needed)
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

-- Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Admins can update any profile
create policy "Admins can update any profile" on public.profiles
  for update using (public.is_admin());

-- 3. Leads
-- Admins have full access
create policy "Admins have full access to leads" on public.leads
  for all using (public.is_admin());

-- Employees can view all leads (Open CRM model)
create policy "Authenticated users can view leads" on public.leads
  for select using (auth.role() = 'authenticated');

-- Employees can create leads and assign to anyone
create policy "Authenticated users can create leads" on public.leads
  for insert with check (auth.role() = 'authenticated');

-- Employees can update leads they are assigned to
create policy "Employees can update assigned leads" on public.leads
  for update using (auth.uid() = assigned_to);

-- 4. Deals
-- Admins have full access
create policy "Admins have full access to deals" on public.deals
  for all using (public.is_admin());

-- Employees can view deals they own
create policy "Employees can view own deals" on public.deals
  for select using (auth.uid() = owner_id);
-- Maybe allow viewing all deals? Let's stick to own for now for privacy/competition, or make it open. 
-- "Employees can view all deals" might be better for collaboration. let's go with "Own Deals" to demonstrate specific logic.

-- Employees can create deals
create policy "Employees can create deals" on public.deals
  for insert with check (auth.uid() = owner_id);

-- Employees can update own deals
create policy "Employees can update own deals" on public.deals
  for update using (auth.uid() = owner_id);

-- 5. Followups
-- Admins full access
create policy "Admins full access followups" on public.followups
  for all using (public.is_admin());

-- Users can view/edit their own followups
create policy "Users manage own followups" on public.followups
  for all using (auth.uid() = assigned_to);

-- 6. Activities
-- Read: Viewable if you have access to the related lead/deal? 
-- Simplification: view all activities for now to see history.
create policy "Activities viewable by authenticated users" on public.activities
  for select using (auth.role() = 'authenticated');

-- Create: Users can log activities
create policy "Users can log activities" on public.activities
  for insert with check (auth.uid() = user_id);

-- Update: Users can edit their own activities
create policy "Users edit own activities" on public.activities
  for update using (auth.uid() = user_id);
