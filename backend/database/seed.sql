-- Clean up existing data (optional, be careful in prod!)
-- truncate table public.activities, public.followups, public.deals, public.leads, public.profiles, public.roles cascade;

-- 1. Insert Roles
insert into public.roles (name, description)
values
  ('admin', 'Administrator with full access'),
  ('employee', 'Standard user with limited access')
on conflict (name) do nothing;

-- NOTE: You cannot easily seed 'auth.users' via SQL because it's a Supabase managed table.
-- You must create users via the Supabase Dashboard or Client API.
-- Once users are created, the trigger `handle_new_user` will populate `public.profiles`.

-- Mock Data for Leads (Assumes you have a profile UUID to assign to. 
-- Since we don't know the dynamic UUIDs yet, these inserts might fail foreign key constraints if run blindly.
-- INSTRUCTION: Replace 'PLACEHOLDER_USER_ID' with actual UUIDs from auth.users after signing up.)

/*
-- Example Seed (Run this AFTER creating a user)

insert into public.leads (assigned_to, status, first_name, last_name, email, company, source)
values
  ('PLACEHOLDER_USER_ID', 'new', 'John', 'Doe', 'john@example.com', 'Acme Corp', 'Website'),
  ('PLACEHOLDER_USER_ID', 'qualified', 'Jane', 'Smith', 'jane@tech.com', 'TechGiant', 'Referral');

insert into public.deals (lead_id, owner_id, amount, stage, expected_close_date)
values
  ((select id from public.leads limit 1), 'PLACEHOLDER_USER_ID', 5000, 'negotiation', '2023-12-31');
  
*/
