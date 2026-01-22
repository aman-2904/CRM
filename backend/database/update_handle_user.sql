-- UPDATED HANDLE NEW USER (Supports Admin Secret)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role_id uuid;
  requested_role text;
  admin_secret text;
begin
  -- Get requested role and secret from metadata
  requested_role := new.raw_user_meta_data->>'role';
  admin_secret := new.raw_user_meta_data->>'admin_secret';

  -- Logic to assign role
  if requested_role = 'admin' and admin_secret = 'CRM_SUPER_ADMIN' then
    select id into default_role_id from public.roles where name = 'admin';
  else
    select id into default_role_id from public.roles where name = 'employee';
  end if;
  
  -- Fallback if something went wrong finding the role
  if default_role_id is null then
     select id into default_role_id from public.roles where name = 'employee';
  end if;

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
