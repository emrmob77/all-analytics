create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar text,
  active_admins integer not null default 0 check (active_admins >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_brand_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, brand_id)
);

create table public.platforms (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  logo_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  is_active boolean not null default true,
  spend double precision not null default 0,
  spend_limit double precision not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (brand_id, platform_id)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  platform_id uuid not null references public.platforms(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'paused', 'stopped')),
  budget_used double precision not null default 0,
  budget_limit double precision not null default 0,
  roas double precision not null default 0,
  roas_trend text not null default 'flat' check (roas_trend in ('up', 'down', 'flat')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  source text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_metric_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  metric_id uuid not null references public.metrics(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, brand_id, metric_id)
);

create index idx_user_brand_access_user_id on public.user_brand_access (user_id);
create index idx_user_brand_access_brand_id on public.user_brand_access (brand_id);
create index idx_campaigns_brand_id on public.campaigns (brand_id);
create index idx_campaigns_platform_id on public.campaigns (platform_id);
create index idx_platform_connections_brand_id on public.platform_connections (brand_id);
create index idx_platform_connections_platform_id on public.platform_connections (platform_id);
create index idx_user_metric_preferences_user_brand on public.user_metric_preferences (user_id, brand_id);
create index idx_user_metric_preferences_metric_id on public.user_metric_preferences (metric_id);
create index idx_metrics_category on public.metrics (category);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.has_brand_access(target_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_brand_access uba
    where uba.brand_id = target_brand_id
      and uba.user_id = auth.uid()
  );
$$;

create or replace function public.has_brand_role(target_brand_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_brand_access uba
    where uba.brand_id = target_brand_id
      and uba.user_id = auth.uid()
      and uba.role = any (allowed_roles)
  );
$$;

create or replace function public.has_any_brand_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_brand_access uba
    where uba.user_id = auth.uid()
      and uba.role = any (allowed_roles)
  );
$$;

create or replace function public.reindex_metric_preference_positions(target_user_id uuid, target_brand_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      id,
      row_number() over (order by position asc, created_at asc, id asc) - 1 as next_position
    from public.user_metric_preferences
    where user_id = target_user_id
      and brand_id = target_brand_id
  )
  update public.user_metric_preferences ump
  set position = ranked.next_position
  from ranked
  where ump.id = ranked.id
    and ump.position is distinct from ranked.next_position;
$$;

create or replace function public.set_metric_preference_position()
returns trigger
language plpgsql
as $$
begin
  if new.position is null then
    select coalesce(max(position), -1) + 1
    into new.position
    from public.user_metric_preferences
    where user_id = new.user_id
      and brand_id = new.brand_id;
  end if;

  if new.position < 0 then
    new.position = 0;
  end if;

  return new;
end;
$$;

create or replace function public.reindex_metric_preferences_after_delete()
returns trigger
language plpgsql
as $$
begin
  perform public.reindex_metric_preference_positions(old.user_id, old.brand_id);
  return old;
end;
$$;

do $$
declare
  table_name text;
  table_names text[] := array['users', 'brands', 'user_brand_access', 'platforms', 'platform_connections', 'campaigns', 'metrics', 'user_metric_preferences'];
begin
  foreach table_name in array table_names loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I;', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.update_updated_at_column();', table_name, table_name);
  end loop;
end
$$;

drop trigger if exists set_metric_preference_position_before_write on public.user_metric_preferences;
create trigger set_metric_preference_position_before_write
before insert or update of position on public.user_metric_preferences
for each row
execute function public.set_metric_preference_position();

drop trigger if exists reindex_metric_preferences_after_delete on public.user_metric_preferences;
create trigger reindex_metric_preferences_after_delete
after delete on public.user_metric_preferences
for each row
execute function public.reindex_metric_preferences_after_delete();

alter table public.users enable row level security;
alter table public.brands enable row level security;
alter table public.user_brand_access enable row level security;
alter table public.platforms enable row level security;
alter table public.platform_connections enable row level security;
alter table public.campaigns enable row level security;
alter table public.metrics enable row level security;
alter table public.user_metric_preferences enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select
using (auth.uid() = id);

drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
for insert
with check (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists users_delete_own on public.users;
create policy users_delete_own on public.users
for delete
using (auth.uid() = id);

drop policy if exists brands_select_by_access on public.brands;
create policy brands_select_by_access on public.brands
for select
using (public.has_brand_access(id));

drop policy if exists brands_insert_authenticated on public.brands;
create policy brands_insert_authenticated on public.brands
for insert
with check (auth.uid() is not null);

drop policy if exists brands_update_admin on public.brands;
create policy brands_update_admin on public.brands
for update
using (public.has_brand_role(id, array['owner', 'admin']))
with check (public.has_brand_role(id, array['owner', 'admin']));

drop policy if exists brands_delete_owner_admin on public.brands;
create policy brands_delete_owner_admin on public.brands
for delete
using (public.has_brand_role(id, array['owner', 'admin']));

drop policy if exists user_brand_access_select_self_or_admin on public.user_brand_access;
create policy user_brand_access_select_self_or_admin on public.user_brand_access
for select
using (
  user_id = auth.uid()
  or public.has_brand_role(brand_id, array['owner', 'admin'])
);

drop policy if exists user_brand_access_insert_self_or_admin on public.user_brand_access;
create policy user_brand_access_insert_self_or_admin on public.user_brand_access
for insert
with check (
  auth.uid() = user_id
  and (
    not exists (
      select 1
      from public.user_brand_access existing
      where existing.brand_id = user_brand_access.brand_id
    )
    or public.has_brand_role(brand_id, array['owner', 'admin'])
  )
);

drop policy if exists user_brand_access_update_admin on public.user_brand_access;
create policy user_brand_access_update_admin on public.user_brand_access
for update
using (public.has_brand_role(brand_id, array['owner', 'admin']))
with check (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists user_brand_access_delete_admin on public.user_brand_access;
create policy user_brand_access_delete_admin on public.user_brand_access
for delete
using (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists platforms_select_by_any_access on public.platforms;
create policy platforms_select_by_any_access on public.platforms
for select
using (public.has_any_brand_role(array['owner', 'admin', 'member', 'viewer']));

drop policy if exists platforms_insert_admin on public.platforms;
create policy platforms_insert_admin on public.platforms
for insert
with check (public.has_any_brand_role(array['owner', 'admin']));

drop policy if exists platforms_update_admin on public.platforms;
create policy platforms_update_admin on public.platforms
for update
using (public.has_any_brand_role(array['owner', 'admin']))
with check (public.has_any_brand_role(array['owner', 'admin']));

drop policy if exists platforms_delete_admin on public.platforms;
create policy platforms_delete_admin on public.platforms
for delete
using (public.has_any_brand_role(array['owner', 'admin']));

drop policy if exists platform_connections_select_by_access on public.platform_connections;
create policy platform_connections_select_by_access on public.platform_connections
for select
using (public.has_brand_access(brand_id));

drop policy if exists platform_connections_insert_admin on public.platform_connections;
create policy platform_connections_insert_admin on public.platform_connections
for insert
with check (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists platform_connections_update_admin on public.platform_connections;
create policy platform_connections_update_admin on public.platform_connections
for update
using (public.has_brand_role(brand_id, array['owner', 'admin']))
with check (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists platform_connections_delete_admin on public.platform_connections;
create policy platform_connections_delete_admin on public.platform_connections
for delete
using (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists campaigns_select_by_access on public.campaigns;
create policy campaigns_select_by_access on public.campaigns
for select
using (public.has_brand_access(brand_id));

drop policy if exists campaigns_insert_admin on public.campaigns;
create policy campaigns_insert_admin on public.campaigns
for insert
with check (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists campaigns_update_admin on public.campaigns;
create policy campaigns_update_admin on public.campaigns
for update
using (public.has_brand_role(brand_id, array['owner', 'admin']))
with check (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists campaigns_delete_admin on public.campaigns;
create policy campaigns_delete_admin on public.campaigns
for delete
using (public.has_brand_role(brand_id, array['owner', 'admin']));

drop policy if exists metrics_select_by_any_access on public.metrics;
create policy metrics_select_by_any_access on public.metrics
for select
using (public.has_any_brand_role(array['owner', 'admin', 'member', 'viewer']));

drop policy if exists metrics_insert_admin on public.metrics;
create policy metrics_insert_admin on public.metrics
for insert
with check (public.has_any_brand_role(array['owner', 'admin']));

drop policy if exists metrics_update_admin on public.metrics;
create policy metrics_update_admin on public.metrics
for update
using (public.has_any_brand_role(array['owner', 'admin']))
with check (public.has_any_brand_role(array['owner', 'admin']));

drop policy if exists metrics_delete_admin on public.metrics;
create policy metrics_delete_admin on public.metrics
for delete
using (public.has_any_brand_role(array['owner', 'admin']));

drop policy if exists user_metric_preferences_select_own on public.user_metric_preferences;
create policy user_metric_preferences_select_own on public.user_metric_preferences
for select
using (user_id = auth.uid() and public.has_brand_access(brand_id));

drop policy if exists user_metric_preferences_insert_own on public.user_metric_preferences;
create policy user_metric_preferences_insert_own on public.user_metric_preferences
for insert
with check (user_id = auth.uid() and public.has_brand_access(brand_id));

drop policy if exists user_metric_preferences_update_own on public.user_metric_preferences;
create policy user_metric_preferences_update_own on public.user_metric_preferences
for update
using (user_id = auth.uid() and public.has_brand_access(brand_id))
with check (user_id = auth.uid() and public.has_brand_access(brand_id));

drop policy if exists user_metric_preferences_delete_own on public.user_metric_preferences;
create policy user_metric_preferences_delete_own on public.user_metric_preferences
for delete
using (user_id = auth.uid() and public.has_brand_access(brand_id));
